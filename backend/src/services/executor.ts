import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

const LOG_ROOT = process.env.TASK_LOG_DIR || path.join(process.cwd(), 'logs', 'task');

const ensureLogDir = async () => {
  await mkdir(LOG_ROOT, { recursive: true });
};

const saveLog = async (filename: string, content: string) => {
  await ensureLogDir();
  const full = path.join(LOG_ROOT, filename);
  await writeFile(full, content, { encoding: 'utf-8' });
  return full;
};

type ExecResult = { success: boolean; output?: string; error?: string };

// 超时包装
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  if (!ms || ms <= 0) return promise;
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
  });
};

// 执行 shell 命令
export const runShell = async (command: string, timeoutSeconds: number): Promise<ExecResult> => {
  if (!command) return { success: false, error: 'no command' };
  const timeoutMs = timeoutSeconds > 0 ? timeoutSeconds * 1000 : 0;
  try {
    const output = await withTimeout(
      new Promise<string>((resolve, reject) => {
        exec(command, { maxBuffer: 5 * 1024 * 1024 }, (err, stdout, stderr) => {
          if (err) return reject(stderr || err.message);
          return resolve(stdout || stderr || '');
        });
      }),
      timeoutMs,
    );
    return { success: true, output };
  } catch (error: any) {
    return { success: false, error: typeof error === 'string' ? error : error?.message || 'shell error' };
  }
};

// 执行 http 请求（使用原生 fetch）
export const runHttp = async (
  url: string,
  options: { method?: string; headers?: Record<string, string>; body?: any },
  timeoutSeconds: number,
): Promise<ExecResult> => {
  if (!url) return { success: false, error: 'no url' };
  const timeoutMs = timeoutSeconds > 0 ? timeoutSeconds * 1000 : 0;
  const method = options.method || 'GET';
  const headers = options.headers || {};
  const body = options.body;

  try {
    const response = await withTimeout(
      fetch(url, {
        method,
        headers,
        body: ['GET', 'HEAD'].includes(method.toUpperCase()) ? undefined : body,
      }),
      timeoutMs,
    );
    const text = await response.text();
    if (!response.ok) {
      return { success: false, error: `status ${response.status}: ${text}` };
    }
    return { success: true, output: text };
  } catch (error: any) {
    return { success: false, error: typeof error === 'string' ? error : error?.message || 'http error' };
  }
};

export const executeNode = async (
  type: string,
  config: any,
  timeoutSeconds: number,
): Promise<ExecResult & { logPath?: string }> => {
  const ts = Date.now();
  const nodeLabel = config?.name || type;
  const logFile = `${ts}-${nodeLabel}.log`.replace(/[^a-zA-Z0-9._-]/g, '_');

  const appendLog = async (content: string) => {
    const full = await saveLog(logFile, content);
    return full;
  };

  switch (type) {
    case 'shell':
      {
        const result = await runShell(config?.command, timeoutSeconds);
        const logContent = `# shell\ncmd: ${config?.command || ''}\n---\n${result.output || result.error || ''}`;
        const logPath = await appendLog(logContent);
        return { ...result, logPath };
      }
    case 'http':
      {
        const result = await runHttp(config?.url, { method: config?.method, headers: config?.headers, body: config?.body }, timeoutSeconds);
        const logContent = `# http\nurl: ${config?.url}\nmethod: ${config?.method || 'GET'}\nstatus: ${result.success ? 'ok' : 'error'}\n---\n${result.output || result.error || ''}`;
        const logPath = await appendLog(logContent);
        return { ...result, logPath };
      }
    default:
      {
        const err = { success: false, error: `unsupported type: ${type}` as string };
        const logPath = await appendLog(err.error);
        return { ...err, logPath };
      }
  }
};


