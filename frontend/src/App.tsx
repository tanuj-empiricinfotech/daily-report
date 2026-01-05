import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { queryClient } from './lib/query/queryClient';
import { store, persistor } from './store/store';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { DailyLog } from './pages/DailyLog';
import { CreateLogPage } from './pages/CreateLogPage';
import { EditLogPage } from './pages/EditLogPage';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider } from './contexts/ThemeContext';

function RootRedirect() {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={isAdmin ? '/admin' : '/logs'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RootRedirect />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AppLayout>
              <AdminDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/logs"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DailyLog />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/logs/create"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CreateLogPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/logs/edit/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <EditLogPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </QueryClientProvider>
        </PersistGate>
      </Provider>
    </ThemeProvider>
  );
}

export default App;
