import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const OAuth2RedirectHandler: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const errorParam = urlParams.get('error');

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 3000);
      return;
    }

    if (token) {
      // Store the token
      localStorage.setItem('auth_token', token);
      
      // Fetch user profile
      fetchUserProfile(token)
        .then(() => {
          navigate('/app', { replace: true });
        })
        .catch((err) => {
          console.error('Failed to fetch user profile:', err);
          setError('Failed to complete authentication');
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 3000);
        });
    } else {
      setError('No authentication token received');
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 3000);
    }
  }, [navigate]);

  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch('http://localhost:8080/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const userData = await response.json();
      localStorage.setItem('mapguide_user', JSON.stringify(userData));
      
      // Update auth context if setUser is available
      if (setUser) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="max-w-md mx-auto text-center p-6 bg-slate-800/70 backdrop-blur-lg rounded-2xl shadow-xl border border-slate-600/50">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Authentication Failed</h2>
          <p className="text-slate-300 text-sm mb-4">{error}</p>
          <p className="text-slate-400 text-xs">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="max-w-md mx-auto text-center p-6 bg-slate-800/70 backdrop-blur-lg rounded-2xl shadow-xl border border-blue-400/30">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Completing Authentication</h2>
        <p className="text-slate-300 text-sm">Please wait while we set up your account...</p>
        <div className="mt-4">
          <div className="w-full bg-slate-700/50 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OAuth2RedirectHandler;