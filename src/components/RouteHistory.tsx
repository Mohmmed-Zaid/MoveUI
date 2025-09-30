import React, { useState, useMemo } from 'react';
import { Clock, MapPin, ArrowRight, History, Heart, Trash2, RefreshCw, Filter, Star } from 'lucide-react';
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
  const [filter, setFilter] = useState<'all' | 'favorites' | 'recent'>('all');
  const [deletingRouteId, setDeletingRouteId] = useState<string | null>(null);
  
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

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
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

  // Sort and filter routes
  const filteredAndSortedRoutes = useMemo(() => {
    let filtered = [...routes];

    // Apply filter
    if (filter === 'favorites') {
      filtered = filtered.filter(route => route.isFavorite);
    } else if (filter === 'recent') {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(route => new Date(route.timestamp) > oneWeekAgo);
    }

    // Sort: favorites first, then by timestamp
    return filtered.sort((a, b) => {
      // First priority: favorites
      if (a.isFavorite !== b.isFavorite) {
        return a.isFavorite ? -1 : 1;
      }
      
      // Second priority: timestamp (newest first)
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [routes, filter]);

  const handleToggleFavorite = async (e: React.MouseEvent, routeId: string) => {
    e.stopPropagation();
    setLoadingRouteId(routeId);
    try {
      await toggleFavorite(routeId);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Failed to update favorite status. Please try again.');
    } finally {
      setLoadingRouteId(null);
    }
  };

  const handleDeleteRoute = async (e: React.MouseEvent, routeId: string) => {
    e.stopPropagation();
    
    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to delete this route? This action cannot be undone.');
    
    if (!confirmed) {
      return;
    }

    setDeletingRouteId(routeId);
    try {
      await deleteRoute(routeId);
    } catch (error) {
      console.error('Error deleting route:', error);
      alert('Failed to delete route. Please try again.');
    } finally {
      setDeletingRouteId(null);
    }
  };

  const handleRouteClick = (route: Route) => {
    onSelectRoute(route);
  };

  const favoriteCount = routes.filter(route => route.isFavorite).length;

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
            <span>Routes</span>
          </h3>
          <button
            onClick={refreshRoutes}
            className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
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
          <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Create your first route to get started
          </p>
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
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer pointer-events-none"></div>
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className={`text-lg font-semibold flex items-center space-x-2 ${
          isDark ? 'text-slate-200' : 'text-slate-800'
        }`}>
          <Clock className="w-5 h-5" />
          <span>Routes</span>
          {favoriteCount > 0 && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {favoriteCount} ★
            </span>
          )}
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={refreshRoutes}
            className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
              isDark 
                ? 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200' 
                : 'hover:bg-slate-100/50 text-slate-500 hover:text-slate-700'
            }`}
            title="Refresh routes"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={`flex rounded-lg p-1 mb-4 relative z-10 ${
        isDark ? 'bg-slate-700/30' : 'bg-slate-100/50'
      }`}>
        {[
          { key: 'all', label: 'All', icon: MapPin },
          { key: 'favorites', label: 'Favorites', icon: Star },
          { key: 'recent', label: 'Recent', icon: Clock }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`flex-1 flex items-center justify-center space-x-1 py-2 px-3 rounded-md text-xs font-medium transition-all duration-200 ${
              filter === key
                ? isDark 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-blue-500 text-white shadow-sm'
                : isDark
                  ? 'text-slate-300 hover:text-white hover:bg-slate-600/50'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
            }`}
          >
            <Icon className="w-3 h-3" />
            <span>{label}</span>
            {key === 'favorites' && favoriteCount > 0 && (
              <span className={`ml-1 px-1 py-0.5 rounded-full text-xs ${
                filter === key 
                  ? 'bg-white/20' 
                  : isDark ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-600'
              }`}>
                {favoriteCount}
              </span>
            )}
          </button>
        ))}
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto relative z-10">
        {filteredAndSortedRoutes.length === 0 ? (
          <div className="text-center py-8">
            <Filter className={`w-8 h-8 mx-auto mb-2 ${
              isDark ? 'text-slate-600' : 'text-slate-300'
            }`} />
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              No {filter === 'favorites' ? 'favorite' : filter} routes found
            </p>
          </div>
        ) : (
          filteredAndSortedRoutes.map((route) => (
            <div
              key={route.id}
              className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md group relative overflow-hidden cursor-pointer ${
                route.isFavorite 
                  ? isDark 
                    ? 'bg-gradient-to-r from-yellow-500/5 to-slate-700/30 border-yellow-400/20 hover:border-yellow-400/40' 
                    : 'bg-gradient-to-r from-yellow-50/50 to-white/50 border-yellow-200/50 hover:border-yellow-300/50'
                  : isDark 
                    ? 'bg-slate-700/30 hover:bg-slate-700/50 border-slate-600/30 hover:border-slate-500/50' 
                    : 'bg-white/50 hover:bg-white/70 border-slate-200/50 hover:border-slate-300/50'
              } ${deletingRouteId === route.id ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={() => handleRouteClick(route)}
            >
              {/* Favorite indicator */}
              {route.isFavorite && (
                <div className="absolute top-2 left-2">
                  <Star className={`w-3 h-3 fill-current ${
                    isDark ? 'text-yellow-400' : 'text-yellow-500'
                  }`} />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
              
              {/* Header with time and actions */}
              <div className="flex items-start justify-between mb-2">
                <span className={`text-xs flex-shrink-0 ${
                  route.isFavorite 
                    ? isDark ? 'text-yellow-400' : 'text-yellow-600'
                    : isDark ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {formatTimestamp(route.timestamp)}
                </span>
                <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                  {/* Favorite Button */}
                  <button
                    onClick={(e) => handleToggleFavorite(e, route.id)}
                    disabled={loadingRouteId === route.id}
                    className={`p-1.5 rounded-md transition-all duration-200 hover:scale-110 ${
                      route.isFavorite 
                        ? isDark 
                          ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10' 
                          : 'text-yellow-500 hover:text-yellow-400 hover:bg-yellow-100'
                        : isDark 
                          ? 'text-slate-500 hover:text-yellow-400 hover:bg-slate-600/50' 
                          : 'text-slate-400 hover:text-yellow-500 hover:bg-slate-100'
                    } ${loadingRouteId === route.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={route.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {loadingRouteId === route.id ? (
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Heart className={`w-4 h-4 ${route.isFavorite ? 'fill-current' : ''}`} />
                    )}
                  </button>
                  
                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDeleteRoute(e, route.id)}
                    disabled={deletingRouteId === route.id}
                    className={`p-1.5 rounded-md transition-all duration-200 hover:scale-110 ${
                      isDark 
                        ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10' 
                        : 'text-slate-400 hover:text-red-500 hover:bg-red-100'
                    } ${deletingRouteId === route.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Delete route"
                  >
                    {deletingRouteId === route.id ? (
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Route details */}
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
              
              {/* Route stats */}
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
                </div>
                <span className={`transition-colors text-xs ${
                  isDark 
                    ? 'text-slate-500 group-hover:text-blue-400' 
                    : 'text-slate-400 group-hover:text-blue-500'
                }`}>
                  View →
                </span>
              </div>

              {/* Loading overlay for delete */}
              {deletingRouteId === route.id && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-lg backdrop-blur-sm">
                  <div className="text-center">
                    <div className={`w-6 h-6 border-3 rounded-full animate-spin mx-auto mb-2 ${
                      isDark 
                        ? 'border-red-400/30 border-t-red-400' 
                        : 'border-red-500/30 border-t-red-500'
                    }`}></div>
                    <span className={`text-xs font-medium ${
                      isDark ? 'text-red-300' : 'text-red-600'
                    }`}>
                      Deleting...
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className={`mt-4 pt-4 border-t relative z-10 ${
        isDark ? 'border-slate-600/50' : 'border-slate-200/50'
      }`}>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className={`text-lg font-bold ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              {filteredAndSortedRoutes.length}
            </div>
            <div className={`text-xs ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              {filter === 'favorites' ? 'Favorites' : filter === 'recent' ? 'Recent' : 'Total'}
            </div>
          </div>
          <div>
            <div className={`text-lg font-bold ${
              isDark ? 'text-yellow-400' : 'text-yellow-600'
            }`}>
              {favoriteCount}
            </div>
            <div className={`text-xs ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Favorites
            </div>
          </div>
          <div>
            <div className={`text-lg font-bold ${
              isDark ? 'text-green-400' : 'text-green-600'
            }`}>
              {Math.round(filteredAndSortedRoutes.reduce((acc, route) => acc + route.distance, 0) / 1000)}
            </div>
            <div className={`text-xs ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Total km
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteHistory;
