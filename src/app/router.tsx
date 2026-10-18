import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { LoginPage } from '@/features/auth/LoginPage';
import { HomePage } from '@/features/diseases/HomePage';
import { DiseasePage } from '@/features/diseases/DiseasePage';
import { UsersPage } from '@/features/users/UsersPage';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        element: <RequireAuth />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/d/:key', element: <DiseasePage /> },
          { element: <RequireAuth role="admin" />, children: [{ path: '/users', element: <UsersPage /> }] },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
