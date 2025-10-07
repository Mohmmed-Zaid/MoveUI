import React, { useState } from 'react';
import { Map, Mail, Lock, Eye, EyeOff, Sparkles, User, Shield, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

type Mode = 'login' | 'signup' | 'forgot' | 'reset';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  otp: string;
  newPassword: string;
}

interface Errors {
  [key: string]: string;
}

const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<Mode>('login');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
    newPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { login, signup, quickLogin } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://move-server-66eb.onrender.com/api';

  const validateForm = (): boolean => {
    const newErrors: Errors = {};

    if (mode === 'signup' && !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email && mode !== 'reset') {
      newErrors.email = 'Email is required';
    } else if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (mode === 'login' || mode === 'signup') {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (mode === 'signup' && formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (mode === 'reset') {
      if (!formData.newPassword) {
        newErrors.newPassword = 'New password is required';
      } else if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters';
      }
    }

    if (mode === 'reset' && !formData.otp) {
      newErrors.otp = 'OTP is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const startCountdown = () => {
    setOtpCountdown(60);
    const timer = setInterval(() => {
      setOtpCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOTP = async () => {
    try {
      setErrors({});
      setLoading(true);

      // For password reset OTP
      const endpoint = `${API_BASE_URL}/auth/otp/password-reset/send`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (data.success) {
        startCountdown();
        setSuccessMessage('OTP resent successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrors({ general: data.message || 'Failed to resend OTP' });
      }
    } catch (error: any) {
      setErrors({ general: error.message || 'Failed to resend OTP. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setErrors({});
      setLoading(true);
      
      if (mode === 'login') {
        await login(formData.email, formData.password);
        navigate('/app');
      } 
      else if (mode === 'signup') {
        await signup({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
        navigate('/app');
      }
      else if (mode === 'forgot') {
        const endpoint = `${API_BASE_URL}/auth/otp/password-reset/send`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const data = await response.json();

        if (data.success) {
          setMode('reset');
          startCountdown();
          setSuccessMessage('OTP sent to your email!');
          setTimeout(() => setSuccessMessage(''), 3000);
        } else {
          setErrors({ general: data.message || 'Failed to send reset OTP' });
        }
      }
      else if (mode === 'reset') {
        const endpoint = `${API_BASE_URL}/auth/password/reset`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            otp: formData.otp,
            newPassword: formData.newPassword,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const data = await response.json();

        if (data.success) {
          setSuccessMessage('Password reset successful! Redirecting to login...');
          setTimeout(() => {
            switchMode('login');
          }, 2000);
        } else {
          setErrors({ general: data.message || 'Password reset failed' });
        }
      }
    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage = error.name === 'AbortError'
        ? 'Server is taking too long. Please wait a moment and try again.'
        : error.message || 'An error occurred. Please try again.';
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    try {
      await quickLogin();
      navigate('/app');
    } catch (error: any) {
      setErrors({
        general: 'Quick login failed. Please use proper authentication.'
      });
    }
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setFormData({ 
      name: '', 
      email: '', 
      password: '', 
      confirmPassword: '', 
      otp: '', 
      newPassword: '' 
    });
    setErrors({});
    setSuccessMessage('');
    setOtpCountdown(0);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowNewPassword(false);
  };

  const renderQuickLoginButton = () => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div className="mb-6">
        <button
          type="button"
          onClick={handleQuickLogin}
          className={`w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl border-2 border-dashed transition-all duration-200 hover:scale-[1.02] ${
            isDark 
              ? 'bg-slate-700/30 border-blue-400/50 text-blue-300 hover:bg-slate-700/50' 
              : 'bg-blue-50/70 border-blue-300/50 text-blue-600 hover:bg-blue-100/70'
          }`}
        >
          <User className="w-5 h-5" />
          Quick Login (Development)
        </button>
        <p className={`text-xs text-center mt-2 ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}>
          Skip authentication for testing
        </p>
      </div>
    );
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

        {/* Quick Login Button */}
        {renderQuickLoginButton()}

        {/* Mode Switch - Hide during forgot and reset */}
        {mode !== 'forgot' && mode !== 'reset' && (
          <div className={`flex rounded-xl p-1 mb-6 ${
            isDark ? 'bg-slate-700/50' : 'bg-slate-100/50'
          }`}>
            <button
              type="button"
              onClick={() => mode !== 'login' && switchMode('login')}
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
              onClick={() => mode !== 'signup' && switchMode('signup')}
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
        )}

        {/* Forgot Password Header */}
        {mode === 'forgot' && (
          <div className="text-center mb-6">
            <h3 className={`text-lg font-semibold mb-2 ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}>Forgot Password?</h3>
            <p className={`text-sm ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Enter your email and we'll send you an OTP to reset your password
            </p>
          </div>
        )}

        {/* Reset Password Header */}
        {mode === 'reset' && (
          <div className="text-center mb-6">
            <h3 className={`text-lg font-semibold mb-2 ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}>Reset Password</h3>
            <p className={`text-sm ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Enter the OTP and your new password
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className={`border rounded-lg p-3 flex items-start gap-2 ${
              isDark 
                ? 'bg-red-500/20 border-red-400/30' 
                : 'bg-red-50/80 border-red-200/50'
            }`}>
              <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                isDark ? 'text-red-300' : 'text-red-600'
              }`} />
              <p className={`text-sm ${
                isDark ? 'text-red-200' : 'text-red-700'
              }`}>{errors.general}</p>
            </div>
          )}

          {successMessage && (
            <div className={`border rounded-lg p-3 ${
              isDark 
                ? 'bg-green-500/20 border-green-400/30' 
                : 'bg-green-50/80 border-green-200/50'
            }`}>
              <p className={`text-sm text-center ${
                isDark ? 'text-green-200' : 'text-green-700'
              }`}>{successMessage}</p>
            </div>
          )}

          {mode === 'forgot' ? (
            // Forgot Password - Email only
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
          ) : mode === 'reset' ? (
            // Reset Password - OTP and New Password
            <>
              <div className="space-y-2">
                <label className={`text-sm font-medium ${
                  isDark ? 'text-slate-200' : 'text-slate-700'
                }`}>Enter OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  value={formData.otp}
                  onChange={(e) => handleInputChange('otp', e.target.value.replace(/\D/g, ''))}
                  className={`w-full px-4 py-3 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-center text-lg font-mono tracking-widest ${
                    isDark 
                      ? `bg-slate-700/50 text-white placeholder-slate-400 focus:ring-blue-400/50 ${
                          errors.otp ? 'border-red-400/50' : 'border-slate-600/50'
                        }` 
                      : `bg-white/70 text-slate-900 placeholder-slate-500 focus:ring-blue-500/50 ${
                          errors.otp ? 'border-red-300/50' : 'border-slate-300/50'
                        }`
                  }`}
                  placeholder="000000"
                />
                {errors.otp && <p className={`text-xs ${
                  isDark ? 'text-red-300' : 'text-red-600'
                }`}>{errors.otp}</p>}
              </div>

              <div className="space-y-2">
                <label className={`text-sm font-medium ${
                  isDark ? 'text-slate-200' : 'text-slate-700'
                }`}>New Password</label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`} />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    className={`w-full pl-10 pr-12 py-3 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                      isDark 
                        ? `bg-slate-700/50 text-white placeholder-slate-400 focus:ring-blue-400/50 ${
                            errors.newPassword ? 'border-red-400/50' : 'border-slate-600/50'
                          }` 
                        : `bg-white/70 text-slate-900 placeholder-slate-500 focus:ring-blue-500/50 ${
                            errors.newPassword ? 'border-red-300/50' : 'border-slate-300/50'
                          }`
                    }`}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                      isDark 
                        ? 'text-slate-400 hover:text-slate-200' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.newPassword && <p className={`text-xs ${
                  isDark ? 'text-red-300' : 'text-red-600'
                }`}>{errors.newPassword}</p>}
              </div>

              {/* Resend OTP for reset */}
              <div className="text-center">
                {otpCountdown > 0 ? (
                  <p className={`text-xs ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Resend OTP in {otpCountdown}s
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={loading}
                    className={`text-xs transition-colors disabled:opacity-50 ${
                      isDark 
                        ? 'text-blue-400 hover:text-blue-300' 
                        : 'text-blue-600 hover:text-blue-700'
                    }`}
                  >
                    {loading ? 'Sending...' : 'Resend OTP'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
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
            </>
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
                <span>
                  {mode === 'login' ? 'Signing in...' : 
                   mode === 'signup' ? 'Creating account...' : 
                   mode === 'forgot' ? 'Sending OTP...' :
                   'Resetting...'}
                </span>
              </div>
            ) : (
              mode === 'login' ? 'Sign In' : 
              mode === 'signup' ? 'Create Account' : 
              mode === 'forgot' ? 'Send Reset OTP' :
              'Reset Password'
            )}
          </button>

          {/* Back to Login for Reset */}
          {mode === 'reset' && (
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`w-full text-sm transition-colors flex items-center justify-center gap-2 ${
                isDark 
                  ? 'text-slate-400 hover:text-slate-200' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          )}
        </form>

        {/* Footer Links */}
        {mode === 'login' && (
          <div className="mt-6 text-center">
            <button 
              onClick={() => switchMode('forgot')}
              className={`text-sm transition-colors ${
                isDark 
                  ? 'text-slate-300 hover:text-white' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Forgot Password?
            </button>
          </div>
        )}

        {mode !== 'forgot' && mode !== 'reset' && (
          <div className="mt-8 text-center">
            <div className={`text-sm ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
              <button 
                type="button"
                onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
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
        )}
      </div>

      {/* Custom CSS */}
      <style>{`
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
