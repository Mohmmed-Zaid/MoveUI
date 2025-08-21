import React, { useState } from 'react';
import { Clock, MapPin, ArrowRight, History, Heart, Trash2, RefreshCw } from 'lucide-react';
import { Route } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';

interface RouteHistoryProps {
  routes: Route[];
  onSelectRoute: (route: Route) => void;
  className?: string;
}

const RouteHistory: React.FC<RouteHistoryProps> = ({ routes, onSelectRoute, className = '' }) => {
  const { isDark } = useTheme();
  const { toggleFavorite, deleteRoute, refreshRoutes } = useApp();
  const [loadingRouteId, setLoadingRouteId] = useState<string | null>(null);
  
  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${Math.round(distance)} m`;
    }
    return `${(distance / 1000).toFixed(1)} km`;
  };

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const truncateAddress = (address: string, maxLength: number = 35) => {
    if (address.length <= maxLength) return address;
    return address.substring(0, maxLength) + '...';
  };

  const handleToggleFavorite = async (e: React.MouseEvent, routeId: string) => {
    e.stopPropagation();
    setLoadingRouteId(routeId);
    try {
      await toggleFavorite(routeId);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setLoadingRouteId(null);
    }
  };

  const handleDeleteRoute = async (e: React.MouseEvent, routeId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this route?')) {
      setLoadingRouteId(routeId);
      try {
        await deleteRoute(routeId);
      } catch (error) {
        console.error('Error deleting route:', error);
      } finally {
        setLoadingRouteId(null);
      }
    }
  };

  if (routes.length === 0) {
    return (
      <div className={`backdrop-blur-lg rounded-xl p-6 border ${className} ${
        isDark 
          ? 'bg-slate-800/60 border-slate-600/50' 
          : 'bg-white/80 border-slate-200/50'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold flex items-center space-x-2 ${
            isDark ? 'text-slate-200' : 'text-slate-800'
          }`}>
            <Clock className="w-5 h-5" />
            <span>Recent Routes</span>
          </h3>
          <button
            onClick={refreshRoutes}
            className={`p-2 rounded-lg transition-colors ${
              isDark 
                ? 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200' 
                : 'hover:bg-slate-100/50 text-slate-500 hover:text-slate-700'
            }`}
            title="Refresh routes"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="text-center py-8">
          <History className={`w-12 h-12 mx-auto mb-3 ${
            isDark ? 'text-slate-600' : 'text-slate-300'
          }`} />
          <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No routes yet</p>
          <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Your route history will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`backdrop-blur-lg rounded-xl p-6 border relative overflow-hidden ${className} ${
      isDark 
        ? 'bg-slate-800/60 border-slate-600/50' 
        : 'bg-white/80 border-slate-200/50'
    }`}>
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
      
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold flex items-center space-x-2 ${
          isDark ? 'text-slate-200' : 'text-slate-800'
        }`}>
          <Clock className="w-5 h-5" />
          <span>Recent Routes</span>
        </h3>
        <button
          onClick={refreshRoutes}
          className={`p-2 rounded-lg transition-colors ${
            isDark 
              ? 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200' 
              : 'hover:bg-slate-100/50 text-slate-500 hover:text-slate-700'
          }`}
          title="Refresh routes"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {routes.map((route) => (
          <div
            key={route.id}
            className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md text-left group relative overflow-hidden ${
              isDark 
                ? 'bg-slate-700/30 hover:bg-slate-700/50 border-slate-600/30 hover:border-slate-500/50' 
                : 'bg-white/50 hover:bg-white/70 border-slate-200/50 hover:border-slate-300/50'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            
            {/* Header with time and actions */}
            <div className="flex items-start justify-between mb-2">
              <span className={`text-xs flex-shrink-0 ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {formatTimestamp(route.timestamp)}
              </span>
              <div className="flex items-center space-x-1">
                {/* Favorite Button */}
                <button
                  onClick={(e) => handleToggleFavorite(e, route.id)}
                  disabled={loadingRouteId === route.id}
                  className={`p-1 rounded transition-colors ${
                    route.isFavorite 
                      ? isDark ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-400'
                      : isDark ? 'text-slate-500 hover:text-red-400' : 'text-slate-400 hover:text-red-500'
                  } ${loadingRouteId === route.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={route.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`w-3 h-3 ${route.isFavorite ? 'fill-current' : ''}`} />
                </button>
                
                {/* Delete Button */}
                <button
                  onClick={(e) => handleDeleteRoute(e, route.id)}
                  disabled={loadingRouteId === route.id}
                  className={`p-1 rounded transition-colors ${
                    isDark ? 'text-slate-500 hover:text-red-400' : 'text-slate-400 hover:text-red-500'
                  } ${loadingRouteId === route.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="Delete route"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Route details */}
            <button
              onClick={() => onSelectRoute(route)}
              className="w-full text-left"
            >
              <div className="flex-1 min-w-0 mb-2">
                <div className="flex items-center space-x-2 mb-1">
                  <MapPin className={`w-3 h-3 flex-shrink-0 ${
                    isDark ? 'text-green-400' : 'text-green-500'
                  }`} />
                  <span className={`text-xs truncate ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {truncateAddress(route.from.address)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <ArrowRight className={`w-3 h-3 flex-shrink-0 ${
                    isDark ? 'text-slate-500' : 'text-slate-400'
                  }`} />
                  <span className={`text-xs truncate ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {truncateAddress(route.to.address)}
                  </span>
                </div>
              </div>
              
              {/* Route stats and transport mode */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-4">
                  <span className={`font-medium ${
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    {formatDistance(route.distance)}
                  </span>
                  <span className={`font-medium ${
                    isDark ? 'text-cyan-400' : 'text-cyan-600'
                  }`}>
                    {formatDuration(route.duration)}
                  </span>
                  {route.transportMode && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isDark 
                        ? 'bg-slate-600/50 text-slate-300' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {route.transportMode.toLowerCase()}
                    </span>
                  )}
                </div>
                <span className={`transition-colors ${
                  isDark 
                    ? 'text-slate-500 group-hover:text-blue-400' 
                    : 'text-slate-400 group-hover:text-blue-500'
                }`}>
                  View →
                </span>
              </div>

              {/* Route type indicator */}
              {route.routeType && (
                <div className={`mt-2 text-xs ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {route.routeType === 'FASTEST' ? '⚡ Fastest route' : 
                   route.routeType === 'SHORTEST' ? '📏 Shortest route' : 
                   '⚖️ Balanced route'}
                </div>
              )}
            </button>

            {/* Loading overlay for individual route actions */}
            {loadingRouteId === route.id && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-lg">
                <div className={`w-4 h-4 border-2 rounded-full animate-spin ${
                  isDark 
                    ? 'border-blue-400/30 border-t-blue-400' 
                    : 'border-blue-500/30 border-t-blue-500'
                }`}></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Filter/Sort Options */}
      <div className={`mt-4 pt-4 border-t ${
        isDark ? 'border-slate-600/50' : 'border-slate-200/50'
      }`}>
        <div className="flex items-center justify-between text-xs">
          <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {routes.length} route{routes.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center space-x-2">
            <button className={`px-2 py-1 rounded transition-colors ${
              isDark 
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
            }`}>
              Recent
            </button>
            <span className={`${isDark ? 'text-slate-600' : 'text-slate-300'}`}>•</span>
            <button className={`px-2 py-1 rounded transition-colors ${
              isDark 
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
            }`}>
              Favorites
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteHistory;