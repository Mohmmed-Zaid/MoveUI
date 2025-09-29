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

  // Set up automatic token refresh for authenticated users only
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;
    
    if (user && user.isAuthenticated && localStorage.getItem('auth_token')) {
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
    try {
      // First check for regular user
      const savedUser = localStorage.getItem('mapguide_user');
      const token = localStorage.getItem('auth_token');
      
      // Check for temp/guest user
      const tempUser = localStorage.getItem('mapguide_user_temp');
      
      if (savedUser && token) {
        try {
          const parsedUser = JSON.parse(savedUser);
          
          // Skip token validation for now to prevent auto-logout
          // Set user directly from localStorage
          const validatedUser: User = {
            id: parsedUser.id,
            name: parsedUser.name,
            email: parsedUser.email,
            isAuthenticated: true,
            createdAt: parsedUser.createdAt,
            avatarUrl: parsedUser.avatarUrl
          };
          
          setUser(validatedUser);
          
          // Validate token in background (non-blocking)
          validateTokenInBackground(token, validatedUser);
          
        } catch (error) {
          console.error('Error parsing saved user:', error);
          clearAuthData();
        }
      } else if (tempUser) {
        // Load temp/guest user
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}/auth/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.warn('Token validation failed in background, but user remains logged in');
        // Don't logout automatically, just log the warning
      }
    } catch (error) {
      console.warn('Background token validation failed:', error);
      // Don't logout automatically on network errors
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
      // Don't auto logout on refresh failure
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
      const response = await authService.signin({ email, password });
      
      if (response && response.accessToken && response.user) {
        // Store auth data
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
        // Remove temp user if exists
        localStorage.removeItem('mapguide_user_temp');
        setUser(authenticatedUser);
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

  // FIXED: This now just sends the OTP, doesn't create the account
  const signup = async (userData: { name: string; email: string; password: string }): Promise<void> => {
    setLoading(true);
    try {
      // Store the signup data temporarily
      localStorage.setItem('temp_signup_data', JSON.stringify(userData));
      
      // Send OTP to email
      await authService.sendSignupOTP(userData.email);
      
    } catch (error: any) {
      console.error('Signup error:', error);
      const errorMessage = error.message || 'Failed to send signup OTP';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: This sends the OTP
  const sendOTP = async (email: string): Promise<void> => {
    setLoading(true);
    try {
      await authService.sendSignupOTP(email);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to send OTP';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: This verifies OTP and creates the account
  const verifyOTP = async (email: string, otp: string): Promise<void> => {
    setLoading(true);
    try {
      // Get the stored signup data
      const tempSignupData = localStorage.getItem('temp_signup_data');
      if (!tempSignupData) {
        throw new Error('Signup data not found. Please start signup process again.');
      }

      const signupData = JSON.parse(tempSignupData);
      
      // Verify that email matches
      if (signupData.email !== email) {
        throw new Error('Email mismatch. Please start signup process again.');
      }

      // Create the account with OTP
      const response = await authService.signupWithOTP({
        ...signupData,
        otp: otp
      });
      
      if (response && response.accessToken && response.user) {
        // Store auth data
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
        // Clean up temp data
        localStorage.removeItem('mapguide_user_temp');
        localStorage.removeItem('temp_signup_data');
        setUser(authenticatedUser);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'OTP verification failed';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (): Promise<void> => {
    setLoading(true);
    try {
      // Create a temporary user for quick access
      const tempUser: User = {
        id: 'temp-' + Date.now(),
        name: 'Guest User',
        email: 'guest@mapguide.com',
        isAuthenticated: false,
        createdAt: new Date().toISOString(),
      };
      
      // Store temporarily and remove any existing auth data
      localStorage.removeItem('mapguide_user');
      localStorage.removeItem('auth_token');
      localStorage.setItem('mapguide_user_temp', JSON.stringify(tempUser));
      setUser(tempUser);
    } catch (error: any) {
      const errorMessage = error.message || 'Quick login failed';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
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