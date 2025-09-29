import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppProvider } from './contexts/AppContext';
import LoginPage from './components/LoginPage';
import RouteFinder from './components/RouteFinder';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/app" replace /> : <LoginPage />} 
      />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <RouteFinder />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/" 
        element={<Navigate to={user ? "/app" : "/login"} replace />} 
      />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <Router>
            <div className="font-inter">
              <AppRoutes />
            </div>
          </Router>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;