import React, { useState, useEffect } from 'react';
import { Menu, X, Sparkles, MapPin, ArrowUpDown } from 'lucide-react';
import Navbar from './Navbar';
import RouteInput from './RouteInput';
import MapComponent from './MapComponent';
import RouteHistory from './RouteHistory';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { routeService } from '../services/api';
import { Route } from '../types';

const RouteFinder: React.FC = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [fromCoords, setFromCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [toCoords, setToCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  const { routes, currentRoute, addRoute, setCurrentRoute, loading, setLoading } = useApp();
  const { isDark } = useTheme();
  const { user } = useAuth();

  // Load saved route inputs for current user on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      const storageKey = `mapguide_route_input_${user.id}`;
      const savedRouteInput = localStorage.getItem(storageKey);
      
      if (savedRouteInput) {
        try {
          const parsed = JSON.parse(savedRouteInput);
          setFrom(parsed.from || '');
          setTo(parsed.to || '');
          setFromCoords(parsed.fromCoords || null);
          setToCoords(parsed.toCoords || null);
        } catch (error) {
          console.error('Error loading saved route input:', error);
        }
      } else {
        // Clear inputs if no saved data for this user
        setFrom('');
        setTo('');
        setFromCoords(null);
        setToCoords(null);
      }
      setCurrentRoute(null);
      setError(null);
    } else {
      // No user logged in, clear everything
      setFrom('');
      setTo('');
      setFromCoords(null);
      setToCoords(null);
      setCurrentRoute(null);
      setError(null);
    }
  }, [user?.id, setCurrentRoute]);

  // Save route inputs whenever they change (for current user)
  useEffect(() => {
    if (user?.id) {
      const storageKey = `mapguide_route_input_${user.id}`;
      const routeInput = {
        from,
        to,
        fromCoords,
        toCoords
      };
      localStorage.setItem(storageKey, JSON.stringify(routeInput));
    }
  }, [from, to, fromCoords, toCoords, user?.id]);

  const handleFromChange = (value: string, coordinates?: { lat: number; lng: number }) => {
    setFrom(value);
    setFromCoords(coordinates || null);
    setError(null);
  };

  const handleToChange = (value: string, coordinates?: { lat: number; lng: number }) => {
    setTo(value);
    setToCoords(coordinates || null);
    setError(null);
  };

  const handleFindRoute = async () => {
    if (!fromCoords || !toCoords) {
      setError('Please select valid locations from the suggestions');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const routeData = await routeService.getRoute(
        { lat: fromCoords.lat, lng: fromCoords.lng, address: from },
        { lat: toCoords.lat, lng: toCoords.lng, address: to }
      );

      const newRoute: Route = {
        id: Date.now().toString(),
        from: { lat: fromCoords.lat, lng: fromCoords.lng, address: from },
        to: { lat: toCoords.lat, lng: toCoords.lng, address: to },
        distance: routeData.distance,
        duration: routeData.duration,
        coordinates: routeData.coordinates,
        timestamp: new Date().toISOString(),
      };

      addRoute(newRoute);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate route');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRoute = (route: Route) => {
    setCurrentRoute(route);
    setFrom(route.from.address);
    setTo(route.to.address);
    setFromCoords({ lat: route.from.lat, lng: route.from.lng });
    setToCoords({ lat: route.to.lat, lng: route.to.lng });
    setSidebarOpen(false);
  };

  const toggleFullscreenMap = () => {
    setIsMapFullscreen(!isMapFullscreen);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-slate-900' : 'bg-white'
    }`}>
      <Navbar />
      
      <div className="relative">
        {/* Mobile Sidebar Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`lg:hidden fixed top-20 left-4 z-50 p-3 backdrop-blur-lg rounded-xl shadow-lg border transition-all duration-200 hover:scale-105 ${
            isDark 
              ? 'bg-slate-800/90 border-slate-700/50' 
              : 'bg-white/90 border-slate-200/50'
          }`}
        >
          {sidebarOpen ? (
            <X className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} />
          ) : (
            <Menu className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} />
          )}
        </button>

        {/* Mobile Map Fullscreen Toggle */}
        <button
          onClick={toggleFullscreenMap}
          className={`md:hidden fixed top-20 right-4 z-50 p-3 backdrop-blur-lg rounded-xl shadow-lg border transition-all duration-200 hover:scale-105 ${
            isDark 
              ? 'bg-slate-800/90 border-slate-700/50' 
              : 'bg-white/90 border-slate-200/50'
          }`}
        >
          <ArrowUpDown className={`w-5 h-5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} />
        </button>

        <div className="flex">
          {/* Sidebar */}
          <div className={`
            fixed lg:static top-0 left-0 h-full lg:h-auto w-80 lg:w-80 
            backdrop-blur-lg lg:backdrop-blur-none
            border-r lg:border-none
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            z-40 lg:z-auto pt-16 lg:pt-0 p-4
            overflow-y-auto
            ${isDark 
              ? 'bg-slate-900/95 lg:bg-transparent border-slate-700/50' 
              : 'bg-white/95 lg:bg-transparent border-slate-200/50'
            }
          `}>
            <RouteHistory
              routes={routes}
              onSelectRoute={handleSelectRoute}
              className="sticky top-4"
            />
          </div>

          {/* Main Content */}
          <div className={`flex-1 min-h-screen ${isMapFullscreen ? 'md:flex md:flex-col' : ''}`}>
            {/* Route Input Section */}
            <div className={`${isMapFullscreen ? 'md:order-2 md:flex-shrink-0' : ''} p-3 sm:p-6 relative overflow-hidden ${
              isDark 
                ? 'bg-gradient-to-r from-slate-800 to-slate-700' 
                : 'bg-gradient-to-r from-blue-50/50 to-cyan-50/50'
            }`}>
              {/* Floating particles for visual appeal */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className={`absolute w-1 h-1 rounded-full animate-float ${
                      isDark ? 'bg-blue-400/20' : 'bg-blue-300/30'
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
              
              <RouteInput
                from={from}
                to={to}
                onFromChange={handleFromChange}
                onToChange={handleToChange}
                onFindRoute={handleFindRoute}
                loading={loading}
              />
              
              {/* Error Message */}
              {error && (
                <div className={`max-w-6xl mx-auto mt-4 p-4 border rounded-xl backdrop-blur-sm ${
                  isDark 
                    ? 'bg-red-500/10 border-red-400/30 text-red-300' 
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  <div className="flex items-start space-x-2">
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                      isDark ? 'bg-red-400/20' : 'bg-red-100'
                    }`}>
                      <span className="text-xs">!</span>
                    </div>
                    <p className="text-sm font-medium flex-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Current Route Quick Info - Mobile */}
              {currentRoute && (
                <div className={`md:hidden max-w-6xl mx-auto mt-4 p-4 rounded-xl border backdrop-blur-sm ${
                  isDark 
                    ? 'bg-slate-800/60 border-slate-600/50' 
                    : 'bg-white/80 border-slate-200/50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MapPin className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                      <span className={`text-sm font-medium ${
                        isDark ? 'text-slate-200' : 'text-slate-700'
                      }`}>Current Route</span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs">
                      <span className={`${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        {currentRoute.distance < 1000 
                          ? `${Math.round(currentRoute.distance)} m`
                          : `${(currentRoute.distance / 1000).toFixed(1)} km`
                        }
                      </span>
                      <span className={`${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                        {Math.floor(currentRoute.duration / 3600) > 0 
                          ? `${Math.floor(currentRoute.duration / 3600)}h ${Math.floor((currentRoute.duration % 3600) / 60)}m`
                          : `${Math.floor(currentRoute.duration / 60)}m`
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Map Section */}
            <div className={`${
              isMapFullscreen 
                ? 'md:order-1 md:flex-1 h-[50vh] md:h-auto' 
                : 'h-[40vh] sm:h-[50vh] lg:h-[calc(100vh-280px)]'
            }`}>
              <MapComponent 
                route={currentRoute} 
                className="w-full h-full" 
              />
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className={`lg:hidden fixed inset-0 z-30 backdrop-blur-sm ${
              isDark ? 'bg-black/40' : 'bg-black/20'
            }`}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${
            isDark ? 'bg-slate-900/50' : 'bg-white/50'
          }`}>
            <div className={`p-6 rounded-2xl shadow-xl border ${
              isDark 
                ? 'bg-slate-800/90 border-slate-600/50' 
                : 'bg-white/90 border-slate-200/50'
            }`}>
              <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 border-4 rounded-full animate-spin ${
                  isDark 
                    ? 'border-blue-400/30 border-t-blue-400' 
                    : 'border-blue-500/30 border-t-blue-500'
                }`}></div>
                <div>
                  <h3 className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    Finding Route
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Please wait while we calculate the best route...
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom CSS for animations */}
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

export default RouteFinder;