import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../layouts/Layout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import DataSource from '../pages/DataSource';
import DataExchange from '../pages/DataExchange';
import VisualETL from '../pages/VisualETL';
import DataCollection from '../pages/DataCollection';
import TaskScheduler from '../pages/TaskScheduler';
import Permission from '../pages/Permission';
import Metadata from '../pages/Metadata';
import DataQuality from '../pages/DataQuality';
import DataModel from '../pages/DataModel';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'data-source',
        element: <DataSource />,
      },
      {
        path: 'data-exchange',
        element: <DataExchange />,
      },
      {
        path: 'visual-etl',
        element: <VisualETL />,
      },
      {
        path: 'data-collection',
        element: <DataCollection />,
      },
      {
        path: 'task-scheduler',
        element: <TaskScheduler />,
      },
      {
        path: 'permission',
        element: <Permission />,
      },
      {
        path: 'metadata',
        element: <Metadata />,
      },
      {
        path: 'data-quality',
        element: <DataQuality />,
      },
      {
        path: 'data-model',
        element: <DataModel />,
      },
    ],
  },
]);

export default router;

