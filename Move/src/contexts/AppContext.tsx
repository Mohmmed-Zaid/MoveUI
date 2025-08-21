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

  // Load user routes on app initialization
  useEffect(() => {
    const loadUserRoutes = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token && !routesLoaded) {
          setLoading(true);
          const response = await routeService.getUserRoutes(0, 10);
          
          // Check if response has the expected structure
          if (response && response.content) {
            // Transform Spring Boot route response to frontend Route format
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
            
            setRoutes(transformedRoutes);
          }
          setRoutesLoaded(true);
        }
      } catch (error) {
        console.error('Error loading user routes:', error);
        setRoutesLoaded(true);
      } finally {
        setLoading(false);
      }
    };

    loadUserRoutes();
  }, [routesLoaded]);

  const addRoute = async (route: Route) => {
    try {
      setLoading(true);
      
      // Save route to Spring Boot backend
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
      
      // Transform response to frontend format
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

      setRoutes(prev => [transformedRoute, ...prev]);
      setCurrentRoute(transformedRoute);
    } catch (error) {
      console.error('Error saving route:', error);
      
      // If backend save fails, still add to local state with temporary ID
      const tempRoute: Route = {
        ...route,
        id: `temp_${Date.now()}`,
        timestamp: new Date().toISOString(),
        isFavorite: false,
        routeType: 'FASTEST',
        transportMode: 'DRIVING',
      };
      
      setRoutes(prev => [tempRoute, ...prev].slice(0, 10));
      setCurrentRoute(tempRoute);
      
      // Show user-friendly error message
      throw new Error('Route calculated but could not be saved to your account. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (routeId: string) => {
    try {
      // Skip API call for temporary routes
      if (routeId.startsWith('temp_')) {
        setRoutes(prev => prev.map(route => 
          route.id === routeId 
            ? { ...route, isFavorite: !route.isFavorite }
            : route
        ));
        
        if (currentRoute?.id === routeId) {
          setCurrentRoute(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
        }
        return;
      }

      const numericId = parseInt(routeId);
      if (isNaN(numericId)) {
        throw new Error('Invalid route ID');
      }

      const updatedRoute = await routeService.toggleFavorite(numericId);
      
      setRoutes(prev => prev.map(route => 
        route.id === routeId 
          ? { ...route, isFavorite: updatedRoute.favorite }
          : route
      ));
      
      if (currentRoute?.id === routeId) {
        setCurrentRoute(prev => prev ? { ...prev, isFavorite: updatedRoute.favorite } : null);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  };

  const deleteRoute = async (routeId: string) => {
    try {
      // For temporary routes, just remove from local state
      if (routeId.startsWith('temp_')) {
        setRoutes(prev => prev.filter(route => route.id !== routeId));
        if (currentRoute?.id === routeId) {
          setCurrentRoute(null);
        }
        return;
      }

      const numericId = parseInt(routeId);
      if (isNaN(numericId)) {
        throw new Error('Invalid route ID');
      }

      await routeService.deleteRoute(numericId);
      
      setRoutes(prev => prev.filter(route => route.id !== routeId));
      
      if (currentRoute?.id === routeId) {
        setCurrentRoute(null);
      }
    } catch (error) {
      console.error('Error deleting route:', error);
      throw error;
    }
  };

  const refreshRoutes = async () => {
    try {
      setLoading(true);
      const response = await routeService.getUserRoutes(0, 20);
      
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
        
        setRoutes(transformedRoutes);
      }
    } catch (error) {
      console.error('Error refreshing routes:', error);
      throw new Error('Failed to refresh routes. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppContext.Provider value={{
      routes,
      currentRoute,
      addRoute,
      setCurrentRoute,
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