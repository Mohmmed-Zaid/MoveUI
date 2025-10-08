import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, User } from '../types';
import { authService } from '../services/api';

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

  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;
    
    if (user && user.isAuthenticated && localStorage.getItem('auth_token')) {
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
    try {
      const savedUser = localStorage.getItem('mapguide_user');
      const token = localStorage.getItem('auth_token');
      const tempUser = localStorage.getItem('mapguide_user_temp');
      
      if (savedUser && token) {
        try {
          const parsedUser = JSON.parse(savedUser);
          
          const validatedUser: User = {
            id: parsedUser.id,
            name: parsedUser.name,
            email: parsedUser.email,
            isAuthenticated: true,
            createdAt: parsedUser.createdAt,
            avatarUrl: parsedUser.avatarUrl
          };
          
          setUser(validatedUser);
          validateTokenInBackground(token, validatedUser);
          
        } catch (error) {
          console.error('Error parsing saved user:', error);
          clearAuthData();
        }
      } else if (tempUser) {
        try {
          const parsedTempUser = JSON.parse(tempUser);
          setUser(parsedTempUser);
        } catch (error) {
          console.error('Error parsing temp user:', error);
          localStorage.removeItem('mapguide_user_temp');
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setInitialized(true);
    }
  };

  const validateTokenInBackground = async (token: string, currentUser: User) => {
    try {
      const isValid = await authService.validateToken(token);
      
      if (!isValid) {
        console.warn('Token validation failed in background, but user remains logged in');
      }
    } catch (error) {
      console.warn('Background token validation failed:', error);
    }
  };

  const refreshToken = async () => {
    const currentToken = localStorage.getItem('auth_token');
    if (!currentToken) return;

    try {
      const response = await authService.refresh(currentToken);
      if (response && response.accessToken) {
        localStorage.setItem('auth_token', response.accessToken);
        if (response.user) {
          const updatedUser: User = {
            id: response.user.id.toString(),
            name: response.user.name,
            email: response.user.email,
            isAuthenticated: true,
            createdAt: response.user.createdAt,
            avatarUrl: response.user.avatarUrl
          };
          setUser(updatedUser);
          localStorage.setItem('mapguide_user', JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
  };

  const clearAuthData = () => {
    localStorage.removeItem('mapguide_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('mapguide_user_temp');
    localStorage.removeItem('temp_signup_data');
    setUser(null);
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('Attempting login for:', email);
      
      const response = await authService.signin({ email, password });
      
      console.log('Login response received:', response);
      
      if (response && response.accessToken && response.user) {
        localStorage.setItem('auth_token', response.accessToken);
        
        const authenticatedUser: User = {
          id: response.user.id.toString(),
          name: response.user.name,
          email: response.user.email,
          isAuthenticated: true,
          createdAt: response.user.createdAt,
          avatarUrl: response.user.avatarUrl
        };
        
        localStorage.setItem('mapguide_user', JSON.stringify(authenticatedUser));
        localStorage.removeItem('mapguide_user_temp');
        setUser(authenticatedUser);
        
        console.log('Login successful, user set:', authenticatedUser);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'Login failed';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData: { name: string; email: string; password: string }): Promise<void> => {
    setLoading(true);
    try {
      console.log('Starting direct signup for:', userData.email);
      
      const response = await authService.signup(userData);
      
      console.log('Signup response received:', response);
      
      if (response && response.accessToken && response.user) {
        localStorage.setItem('auth_token', response.accessToken);
        
        const authenticatedUser: User = {
          id: response.user.id.toString(),
          name: response.user.name,
          email: response.user.email,
          isAuthenticated: true,
          createdAt: response.user.createdAt,
          avatarUrl: response.user.avatarUrl
        };
        
        localStorage.setItem('mapguide_user', JSON.stringify(authenticatedUser));
        localStorage.removeItem('mapguide_user_temp');
        setUser(authenticatedUser);
        
        console.log('Signup successful, user set:', authenticatedUser);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      const errorMessage = error.message || 'Signup failed';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async (email: string): Promise<void> => {
    console.warn('sendOTP is deprecated in direct signup flow');
  };

  const verifyOTP = async (email: string, otp: string): Promise<void> => {
    console.warn('verifyOTP is deprecated in direct signup flow');
  };
  const quickLogin = async (): Promise<void> => {
    setLoading(true);
    try {
      console.log('Quick login initiated');
      
      const tempUser: User = {
        id: 'temp-' + Date.now(),
        name: 'Guest User',
        email: 'guest@mapguide.com',
        isAuthenticated: false,
        createdAt: new Date().toISOString(),
      };
      
      localStorage.removeItem('mapguide_user');
      localStorage.removeItem('auth_token');
      localStorage.setItem('mapguide_user_temp', JSON.stringify(tempUser));
      setUser(tempUser);
      
      console.log('Quick login successful');
    } catch (error: any) {
      console.error('Quick login error:', error);
      const errorMessage = error.message || 'Quick login failed';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    const token = localStorage.getItem('auth_token');
    
    try {
      console.log('Logging out user');
      
      if (token) {
        await authService.signout();
      }
      
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
    }
  };

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-slate-600 dark:text-slate-300">Initializing...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      signup, 
      sendOTP, 
      verifyOTP, 
      quickLogin, 
      loading, 
      setUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
