import React, { useState } from 'react';
import { Map, Mail, Lock, Eye, EyeOff, Sparkles, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const { login, signup, loading } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (mode === 'signup' && !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (mode === 'signup') {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
      } else {
        await signup({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
      }
      navigate('/app');
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : `${mode === 'login' ? 'Login' : 'Signup'} failed`
      });
    }
  };

     const handleOAuthLogin = (provider: 'google' | 'github') => {
     // Updated redirect URI
     const redirectUri = encodeURIComponent('http://localhost:5137/oauth2/redirect');
     const authUrl = `http://localhost:8080/oauth2/authorize/${provider}?redirect_uri=${redirectUri}`;
     window.location.href = authUrl;
      };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-all duration-500 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900' 
        : 'bg-white'
    }`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className={`absolute top-20 left-20 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl animate-pulse ${
          isDark ? 'bg-blue-500/20' : 'bg-blue-200/30'
        }`}></div>
        <div className={`absolute top-40 right-20 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000 ${
          isDark ? 'bg-indigo-500/20' : 'bg-indigo-200/30'
        }`}></div>
        <div className={`absolute bottom-20 left-40 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000 ${
          isDark ? 'bg-cyan-500/20' : 'bg-cyan-200/30'
        }`}></div>
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 rounded-full animate-float ${
                isDark ? 'bg-blue-400/20' : 'bg-blue-300/40'
              }`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Login/Signup Card */}
      <div className={`relative backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md border transition-all duration-300 ${
        isDark 
          ? 'bg-slate-800/40 border-blue-400/30 shadow-blue-500/20' 
          : 'bg-white/60 border-blue-200/50 shadow-blue-200/30'
      }`}>
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg relative overflow-hidden ${
            isDark 
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600' 
              : 'bg-gradient-to-r from-blue-500 to-cyan-500'
          }`}>
            <Map className="w-8 h-8 text-white" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
          </div>
          <h1 className={`text-3xl font-bold mb-2 bg-gradient-to-r bg-clip-text text-transparent ${
            isDark 
              ? 'from-blue-400 to-cyan-400' 
              : 'from-blue-600 to-indigo-600'
          }`}>
            MapGuide
          </h1>
          <p className={`text-sm flex items-center justify-center gap-1 ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            <Sparkles className="w-4 h-4" />
            Your intelligent route companion
          </p>
        </div>

        {/* Mode Switch */}
        <div className={`flex rounded-xl p-1 mb-6 ${
          isDark ? 'bg-slate-700/50' : 'bg-slate-100/50'
        }`}>
          <button
            type="button"
            onClick={() => mode !== 'login' && switchMode()}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              mode === 'login'
                ? isDark 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-blue-500 text-white shadow-md'
                : isDark
                  ? 'text-slate-300 hover:text-white'
                  : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => mode !== 'signup' && switchMode()}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              mode === 'signup'
                ? isDark 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-blue-500 text-white shadow-md'
                : isDark
                  ? 'text-slate-300 hover:text-white'
                  : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className={`border rounded-lg p-3 ${
              isDark 
                ? 'bg-red-500/20 border-red-400/30' 
                : 'bg-red-50/80 border-red-200/50'
            }`}>
              <p className={`text-sm text-center ${
                isDark ? 'text-red-200' : 'text-red-700'
              }`}>{errors.general}</p>
            </div>
          )}

          {/* Name Field - Only for Signup */}
          {mode === 'signup' && (
            <div className="space-y-2">
              <label className={`text-sm font-medium ${
                isDark ? 'text-slate-200' : 'text-slate-700'
              }`}>Full Name</label>
              <div className="relative">
                <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`} />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                    isDark 
                      ? `bg-slate-700/50 text-white placeholder-slate-400 focus:ring-blue-400/50 ${
                          errors.name ? 'border-red-400/50' : 'border-slate-600/50'
                        }` 
                      : `bg-white/70 text-slate-900 placeholder-slate-500 focus:ring-blue-500/50 ${
                          errors.name ? 'border-red-300/50' : 'border-slate-300/50'
                        }`
                  }`}
                  placeholder="Enter your full name"
                />
              </div>
              {errors.name && <p className={`text-xs ${
                isDark ? 'text-red-300' : 'text-red-600'
              }`}>{errors.name}</p>}
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <label className={`text-sm font-medium ${
              isDark ? 'text-slate-200' : 'text-slate-700'
            }`}>Email</label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`} />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full pl-10 pr-4 py-3 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                  isDark 
                    ? `bg-slate-700/50 text-white placeholder-slate-400 focus:ring-blue-400/50 ${
                        errors.email ? 'border-red-400/50' : 'border-slate-600/50'
                      }` 
                    : `bg-white/70 text-slate-900 placeholder-slate-500 focus:ring-blue-500/50 ${
                        errors.email ? 'border-red-300/50' : 'border-slate-300/50'
                      }`
                }`}
                placeholder="Enter your email"
              />
            </div>
            {errors.email && <p className={`text-xs ${
              isDark ? 'text-red-300' : 'text-red-600'
            }`}>{errors.email}</p>}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className={`text-sm font-medium ${
              isDark ? 'text-slate-200' : 'text-slate-700'
            }`}>Password</label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full pl-10 pr-12 py-3 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                  isDark 
                    ? `bg-slate-700/50 text-white placeholder-slate-400 focus:ring-blue-400/50 ${
                        errors.password ? 'border-red-400/50' : 'border-slate-600/50'
                      }` 
                    : `bg-white/70 text-slate-900 placeholder-slate-500 focus:ring-blue-500/50 ${
                        errors.password ? 'border-red-300/50' : 'border-slate-300/50'
                      }`
                }`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                  isDark 
                    ? 'text-slate-400 hover:text-slate-200' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className={`text-xs ${
              isDark ? 'text-red-300' : 'text-red-600'
            }`}>{errors.password}</p>}
          </div>

          {/* Confirm Password Field - Only for Signup */}
          {mode === 'signup' && (
            <div className="space-y-2">
              <label className={`text-sm font-medium ${
                isDark ? 'text-slate-200' : 'text-slate-700'
              }`}>Confirm Password</label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                    isDark 
                      ? `bg-slate-700/50 text-white placeholder-slate-400 focus:ring-blue-400/50 ${
                          errors.confirmPassword ? 'border-red-400/50' : 'border-slate-600/50'
                        }` 
                      : `bg-white/70 text-slate-900 placeholder-slate-500 focus:ring-blue-500/50 ${
                          errors.confirmPassword ? 'border-red-300/50' : 'border-slate-300/50'
                        }`
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                    isDark 
                      ? 'text-slate-400 hover:text-slate-200' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className={`text-xs ${
                isDark ? 'text-red-300' : 'text-red-600'
              }`}>{errors.confirmPassword}</p>}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full font-semibold py-3 px-6 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden ${
              isDark 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white' 
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
              </div>
            ) : (
              mode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>

          {/* OAuth2 Divider */}
          <div className="relative my-6">
            <div className={`absolute inset-0 flex items-center ${
              isDark ? 'opacity-30' : 'opacity-50'
            }`}>
              <div className={`w-full border-t ${
                isDark ? 'border-slate-600' : 'border-slate-300'
              }`}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-2 ${
                isDark 
                  ? 'bg-slate-800/40 text-slate-300' 
                  : 'bg-white/60 text-slate-500'
              }`}>
                Or continue with
              </span>
            </div>
          </div>

          {/* OAuth2 Buttons */}
          <div className="space-y-3">
            {/* Google OAuth */}
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl border transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark 
                  ? 'bg-slate-700/50 border-slate-600/50 text-slate-200 hover:bg-slate-700/70' 
                  : 'bg-white/70 border-slate-300/50 text-slate-700 hover:bg-white/90'
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* GitHub OAuth */}
            <button
              type="button"
              onClick={() => handleOAuthLogin('github')}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl border transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark 
                  ? 'bg-slate-700/50 border-slate-600/50 text-slate-200 hover:bg-slate-700/70' 
                  : 'bg-white/70 border-slate-300/50 text-slate-700 hover:bg-white/90'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              Continue with GitHub
            </button>
          </div>
        </form>

        {/* Footer Links */}
        <div className="mt-8 text-center space-y-2">
          {mode === 'login' && (
            <button className={`text-sm transition-colors ${
              isDark 
                ? 'text-slate-300 hover:text-white' 
                : 'text-slate-600 hover:text-slate-800'
            }`}>
              Forgot Password?
            </button>
          )}
          <div className={`text-sm ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
              type="button"
              onClick={switchMode}
              className={`font-semibold transition-colors ${
                isDark 
                  ? 'text-blue-400 hover:text-blue-300' 
                  : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>

      {/* Custom CSS */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(120deg); }
          66% { transform: translateY(5px) rotate(240deg); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;