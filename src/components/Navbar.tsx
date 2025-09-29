import React from 'react';
import { LogOut, Map, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <nav className={`sticky top-0 z-50 backdrop-blur-md border-b shadow-sm transition-all duration-300 ${
      isDark 
        ? 'bg-slate-900/80 border-slate-700/50' 
        : 'bg-white/80 border-slate-200/50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center relative overflow-hidden ${
              isDark 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600' 
                : 'bg-gradient-to-r from-blue-500 to-cyan-500'
            }`}>
              <Map className="w-5 h-5 text-white" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            </div>
            <span className={`text-xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${
              isDark 
                ? 'from-blue-400 to-cyan-400' 
                : 'from-blue-600 to-indigo-600'
            }`}>
              MapGuide
            </span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* User Info - Mobile Hidden */}
            <span className={`text-sm hidden md:block ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Welcome, {user?.name}
            </span>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                isDark 
                  ? 'bg-slate-700/50 hover:bg-slate-600/50 text-yellow-400' 
                  : 'bg-slate-100/50 hover:bg-slate-200/50 text-slate-600'
              }`}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Logout Button */}
            <button
              onClick={logout}
              className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors duration-200 rounded-lg ${
                isDark 
                  ? 'text-slate-300 hover:text-red-400 hover:bg-red-500/10' 
                  : 'text-slate-700 hover:text-red-600 hover:bg-red-50'
              }`}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;