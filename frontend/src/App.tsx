import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { queryClient } from './lib/query/queryClient';
import { store, persistor } from './store/store';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { DailyLog } from './pages/DailyLog';
import { CreateLogPage } from './pages/CreateLogPage';
import { EditLogPage } from './pages/EditLogPage';
import { Projects } from './pages/Projects';
import { ProjectDetails } from './pages/ProjectDetails';
import { Team } from './pages/Team';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider } from './contexts/ThemeContext';

function RootRedirect() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Protected Routes with Dashboard Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/logs"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <DailyLog />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/logs/create"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CreateLogPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/logs/edit/:id"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <EditLogPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Settings />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/projects"
        element={
          <ProtectedRoute requireAdmin>
            <DashboardLayout>
              <Projects />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <ProtectedRoute requireAdmin>
            <DashboardLayout>
              <ProjectDetails />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/team"
        element={
          <ProtectedRoute requireAdmin>
            <DashboardLayout>
              <Team />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute requireAdmin>
            <DashboardLayout>
              <Analytics />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Legacy admin route redirect */}
      <Route path="/admin" element={<Navigate to="/" replace />} />

      {/* Catch-all redirect */}
      <Route path="*" element={<RootRedirect />} />
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
