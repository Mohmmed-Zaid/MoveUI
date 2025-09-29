import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppContextType, Route } from '../types';
import { routeService } from '../services/api';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);
  const [routesLoaded, setRoutesLoaded] = useState(false);

  // Load routes on app initialization
  useEffect(() => {
    loadRoutes();
  }, []);

  // Save routes to localStorage whenever routes change
  useEffect(() => {
    if (routesLoaded && routes.length > 0) {
      // Save both authenticated user routes and local routes
      const user = JSON.parse(localStorage.getItem('mapguide_user') || '{}');
      if (user.isAuthenticated) {
        localStorage.setItem('mapguide_user_routes', JSON.stringify(routes));
      } else {
        localStorage.setItem('mapguide_local_routes', JSON.stringify(routes));
      }
    }
  }, [routes, routesLoaded]);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('mapguide_user') || '{}');
      const tempUser = localStorage.getItem('mapguide_user_temp');
      
      if (user.isAuthenticated && localStorage.getItem('auth_token')) {
        // Load authenticated user routes from backend and localStorage
        try {
          const response = await routeService.getUserRoutes(0, 50);
          
          if (response && response.content) {
            const transformedRoutes = response.content.map((route: any) => ({
              id: route.id.toString(),
              from: {
                lat: route.fromLatitude,
                lng: route.fromLongitude,
                address: route.fromAddress,
              },
              to: {
                lat: route.toLatitude,
                lng: route.toLongitude,
                address: route.toAddress,
              },
              distance: route.distance,
              duration: route.duration,
              coordinates: route.coordinates || [],
              timestamp: route.createdAt,
              isFavorite: route.favorite,
              routeType: route.routeType,
              transportMode: route.transportMode,
            }));
            
            // Also load any local routes stored for this user
            const localRoutes = JSON.parse(localStorage.getItem('mapguide_user_routes') || '[]');
            
            // Merge server routes with local routes (server routes take precedence)
            const mergedRoutes = [...transformedRoutes];
            localRoutes.forEach((localRoute: Route) => {
              if (!mergedRoutes.find(r => r.id === localRoute.id)) {
                mergedRoutes.push(localRoute);
              }
            });
            
            setRoutes(mergedRoutes);
          } else {
            // Fallback to localStorage if server fails
            const localRoutes = JSON.parse(localStorage.getItem('mapguide_user_routes') || '[]');
            setRoutes(localRoutes);
          }
        } catch (error) {
          console.error('Error loading user routes from server:', error);
          // Fallback to localStorage
          const localRoutes = JSON.parse(localStorage.getItem('mapguide_user_routes') || '[]');
          setRoutes(localRoutes);
        }
      } else {
        // Load local routes for guest users
        const localRoutes = JSON.parse(localStorage.getItem('mapguide_local_routes') || '[]');
        setRoutes(localRoutes);
      }
      
      // Load current route if exists
      const savedCurrentRoute = localStorage.getItem('current_route');
      if (savedCurrentRoute) {
        try {
          setCurrentRoute(JSON.parse(savedCurrentRoute));
        } catch (error) {
          console.error('Error parsing saved current route:', error);
          localStorage.removeItem('current_route');
        }
      }
      
      setRoutesLoaded(true);
    } catch (error) {
      console.error('Error loading routes:', error);
      setRoutesLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const addRoute = async (route: Route) => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('mapguide_user') || '{}');
      
      // For authenticated users, try to save to backend
      if (user.isAuthenticated && localStorage.getItem('auth_token')) {
        try {
          const routeRequest = {
            fromLatitude: route.from.lat,
            fromLongitude: route.from.lng,
            fromAddress: route.from.address,
            toLatitude: route.to.lat,
            toLongitude: route.to.lng,
            toAddress: route.to.address,
            routeType: 'FASTEST' as const,
            transportMode: 'DRIVING' as const,
          };

          const savedRoute = await routeService.calculate(routeRequest);
          
          const transformedRoute: Route = {
            id: savedRoute.id ? savedRoute.id.toString() : Date.now().toString(),
            from: route.from,
            to: route.to,
            distance: savedRoute.distance || route.distance,
            duration: savedRoute.duration || route.duration,
            coordinates: savedRoute.coordinates || route.coordinates,
            timestamp: savedRoute.createdAt || new Date().toISOString(),
            isFavorite: savedRoute.favorite || false,
            routeType: savedRoute.routeType || 'FASTEST',
            transportMode: savedRoute.transportMode || 'DRIVING',
          };

          setRoutes(prev => [transformedRoute, ...prev.slice(0, 49)]);
          setCurrentRoute(transformedRoute);
          
        } catch (backendError) {
          console.error('Backend save failed, storing locally:', backendError);
          // Fall through to local storage
        }
      }
      
      // For guest users or when backend fails, store locally
      const localRoute: Route = {
        ...route,
        id: route.id || `local_${Date.now()}`,
        timestamp: new Date().toISOString(),
        isFavorite: route.isFavorite || false,
        routeType: route.routeType || 'FASTEST',
        transportMode: route.transportMode || 'DRIVING',
      };
      
      setRoutes(prev => {
        // Check if route already exists (avoid duplicates)
        const existing = prev.find(r => 
          r.from.lat === localRoute.from.lat && 
          r.from.lng === localRoute.from.lng &&
          r.to.lat === localRoute.to.lat && 
          r.to.lng === localRoute.to.lng
        );
        
        if (existing) {
          return prev; // Don't add duplicate
        }
        
        return [localRoute, ...prev.slice(0, 49)]; // Keep max 50 routes
      });
      setCurrentRoute(localRoute);
      
    } catch (error) {
      console.error('Error adding route:', error);
      throw new Error('Failed to save route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (routeId: string) => {
    try {
      const user = JSON.parse(localStorage.getItem('mapguide_user') || '{}');
      
      // For backend routes with authenticated users
      if (user.isAuthenticated && !routeId.startsWith('local_') && localStorage.getItem('auth_token')) {
        try {
          const numericId = parseInt(routeId);
          if (!isNaN(numericId)) {
            const updatedRoute = await routeService.toggleFavorite(numericId);
            
            setRoutes(prev => prev.map(route => 
              route.id === routeId 
                ? { ...route, isFavorite: updatedRoute.favorite }
                : route
            ));
            
            if (currentRoute?.id === routeId) {
              setCurrentRoute(prev => prev ? { ...prev, isFavorite: updatedRoute.favorite } : null);
            }
            return;
          }
        } catch (error) {
          console.error('Backend toggle favorite failed:', error);
          // Fall through to local update
        }
      }
      
      // For local routes or when backend fails
      setRoutes(prev => prev.map(route => 
        route.id === routeId 
          ? { ...route, isFavorite: !route.isFavorite }
          : route
      ));
      
      if (currentRoute?.id === routeId) {
        setCurrentRoute(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
      }
      
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  };

  const deleteRoute = async (routeId: string) => {
    try {
      const user = JSON.parse(localStorage.getItem('mapguide_user') || '{}');
      
      // For backend routes with authenticated users
      if (user.isAuthenticated && !routeId.startsWith('local_') && localStorage.getItem('auth_token')) {
        try {
          const numericId = parseInt(routeId);
          if (!isNaN(numericId)) {
            await routeService.deleteRoute(numericId);
          }
        } catch (error) {
          console.error('Backend delete failed:', error);
          // Continue with local delete anyway
        }
      }
      
      // Remove from local state
      setRoutes(prev => prev.filter(route => route.id !== routeId));
      
      if (currentRoute?.id === routeId) {
        setCurrentRoute(null);
        localStorage.removeItem('current_route');
      }
      
    } catch (error) {
      console.error('Error deleting route:', error);
      throw error;
    }
  };

  const refreshRoutes = async () => {
    try {
      setLoading(true);
      await loadRoutes();
    } catch (error) {
      console.error('Error refreshing routes:', error);
      throw new Error('Failed to refresh routes. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const setCurrentRouteAndPersist = (route: Route | null) => {
    setCurrentRoute(route);
    if (route) {
      localStorage.setItem('current_route', JSON.stringify(route));
    } else {
      localStorage.removeItem('current_route');
    }
  };

  return (
    <AppContext.Provider value={{
      routes,
      currentRoute,
      addRoute,
      setCurrentRoute: setCurrentRouteAndPersist,
      toggleFavorite,
      deleteRoute,
      refreshRoutes,
      loading,
      setLoading
    }}>
      {children}
    </AppContext.Provider>
  );
};