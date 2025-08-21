import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, User } from '../types';
import { authService } from '../services/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  // Set up automatic token refresh
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;
    
    if (user) {
      // Refresh token every 20 minutes (before 24-hour expiry)
      refreshInterval = setInterval(() => {
        refreshToken();
      }, 20 * 60 * 1000);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [user]);

  const initializeAuth = async () => {
    const savedUser = localStorage.getItem('mapguide_user');
    const token = localStorage.getItem('auth_token');
    
    if (savedUser && token) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        
        // Validate token by making a test request
        try {
          // You can add a token validation endpoint or just set the user
          // await authService.validateToken(); // if you have this endpoint
          setUser(parsedUser);
        } catch (error) {
          console.error('Token validation failed:', error);
          await logout();
        }
      } catch (error) {
        console.error('Error parsing saved user:', error);
        clearAuthData();
      }
    }
    
    // Check for OAuth2 redirect
    checkForOAuth2Redirect();
    
    setInitialized(true);
  };

  const checkForOAuth2Redirect = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    if (error) {
      console.error('OAuth2 error:', error);
      // Handle OAuth2 error
      return;
    }

    if (token) {
      localStorage.setItem('auth_token', token);
      // Fetch user info with the token
      fetchUserProfile(token);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const fetchUserProfile = async (token: string) => {
    try {
      // You'll need to create this endpoint to get user profile
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('mapguide_user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      clearAuthData();
    }
  };

  const refreshToken = async () => {
    const currentToken = localStorage.getItem('auth_token');
    if (!currentToken) return;

    try {
      const response = await authService.refresh(currentToken);
      localStorage.setItem('auth_token', response.accessToken);
      setUser(response.user);
      localStorage.setItem('mapguide_user', JSON.stringify(response.user));
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
    }
  };

  const clearAuthData = () => {
    localStorage.removeItem('mapguide_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authService.signin({ email, password });
      
      // Store auth data
      localStorage.setItem('auth_token', response.accessToken);
      localStorage.setItem('mapguide_user', JSON.stringify(response.user));
      
      setUser(response.user);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData: { name: string; email: string; password: string }) => {
    setLoading(true);
    try {
      const response = await authService.signup(userData);
      
      // Store auth data
      localStorage.setItem('auth_token', response.accessToken);
      localStorage.setItem('mapguide_user', JSON.stringify(response.user));
      
      setUser(response.user);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Signup failed';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const token = localStorage.getItem('auth_token');
    
    try {
      if (token) {
        await authService.signout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
    }
  };

  // Show loading screen until initialization is complete
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-slate-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, signup, loading }}>
      {children}
    </AuthContext.Provider>
  );
};