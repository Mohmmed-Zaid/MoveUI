import React, { useState } from 'react';
import { Map, Mail, Lock, Eye, EyeOff, Sparkles, User, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup' | 'otp'>('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  
  const { login, signup, sendOTP, verifyOTP, quickLogin, loading } = useAuth();
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

    if (mode !== 'otp') {
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
    }

    if (mode === 'otp') {
      if (!formData.otp) {
        newErrors.otp = 'OTP is required';
      } else if (formData.otp.length !== 6) {
        newErrors.otp = 'OTP must be 6 digits';
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
      await sendOTP(formData.email);
      setOtpSent(true);
      startCountdown();
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to resend OTP'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setErrors({});
      
      if (mode === 'login') {
        await login(formData.email, formData.password);
        navigate('/app');
      } else if (mode === 'signup') {
        // This will store signup data temporarily and send OTP
        await signup({
          name: formData.name,
          email: formData.email,
          password: formData.password
        });
        
        // Switch to OTP mode and start countdown
        setOtpSent(true);
        setMode('otp');
        startCountdown();
      } else if (mode === 'otp') {
        // This will verify OTP and create the account
        await verifyOTP(formData.email, formData.otp);
        navigate('/app');
      }
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : `${
          mode === 'login' ? 'Login' : 
          mode === 'signup' ? 'Signup' : 
          'OTP verification'
        } failed`
      });
    }
  };

  const handleQuickLogin = async () => {
    try {
      await quickLogin();
      navigate('/app');
    } catch (error) {
      setErrors({
        general: 'Quick login failed. Please use proper authentication.'
      });
    }
  };

  const switchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setFormData({ name: '', email: '', password: '', confirmPassword: '', otp: '' });
    setErrors({});
    setOtpSent(false);
    setOtpCountdown(0);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const goBackToSignup = () => {
    setMode('signup');
    setFormData(prev => ({ ...prev, otp: '' }));
    setErrors({});
    setOtpSent(false);
    setOtpCountdown(0);
  };

  const renderQuickLoginButton = () => {
    // Only show for development
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

        {/* Quick Login Button */}
        {renderQuickLoginButton()}

        {/* Mode Switch - Hide during OTP */}
        {mode !== 'otp' && (
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

        {/* OTP Header */}
        {mode === 'otp' && (
          <div className="text-center mb-6">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
              isDark ? 'bg-green-600/20' : 'bg-green-100'
            }`}>
              <Shield className={`w-6 h-6 ${
                isDark ? 'text-green-400' : 'text-green-600'
              }`} />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}>Verify Your Email</h3>
            <p className={`text-sm ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              We've sent a 6-digit code to<br />
              <span className="font-medium">{formData.email}</span>
            </p>
          </div>
        )}

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

          {mode === 'otp' ? (
            // OTP Input
            <div className="space-y-2">
              <label className={`text-sm font-medium ${
                isDark ? 'text-slate-200' : 'text-slate-700'
              }`}>Enter OTP</label>
              <div className="relative">
                <Shield className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`} />
                <input
                  type="text"
                  maxLength={6}
                  value={formData.otp}
                  onChange={(e) => handleInputChange('otp', e.target.value.replace(/\D/g, ''))}
                  className={`w-full pl-10 pr-4 py-3 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 text-center text-lg font-mono tracking-widest ${
                    isDark 
                      ? `bg-slate-700/50 text-white placeholder-slate-400 focus:ring-green-400/50 ${
                          errors.otp ? 'border-red-400/50' : 'border-slate-600/50'
                        }` 
                      : `bg-white/70 text-slate-900 placeholder-slate-500 focus:ring-green-500/50 ${
                          errors.otp ? 'border-red-300/50' : 'border-slate-300/50'
                        }`
                  }`}
                  placeholder="000000"
                />
              </div>
              {errors.otp && <p className={`text-xs ${
                isDark ? 'text-red-300' : 'text-red-600'
              }`}>{errors.otp}</p>}
              
              {/* Resend OTP */}
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
            </div>
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
                   mode === 'signup' ? 'Sending OTP...' : 
                   'Verifying...'}
                </span>
              </div>
            ) : (
              mode === 'login' ? 'Sign In' : 
              mode === 'signup' ? 'Send OTP' : 
              'Verify & Create Account'
            )}
          </button>

          {/* Back to Signup for OTP */}
          {mode === 'otp' && (
            <button
              type="button"
              onClick={goBackToSignup}
              className={`w-full text-sm transition-colors ${
                isDark 
                  ? 'text-slate-400 hover:text-slate-200' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              ← Back to Sign Up
            </button>
          )}
        </form>

        {/* Footer Links */}
        {mode !== 'otp' && (
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