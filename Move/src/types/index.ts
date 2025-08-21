export interface User {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoutePoint {
  lat: number;
  lng: number;
  address: string;
}

export interface Route {
  id: string;
  from: RoutePoint;
  to: RoutePoint;
  distance: number;
  duration: number;
  coordinates: [number, number][];
  timestamp: string;
  isFavorite?: boolean;
  routeType?: 'FASTEST' | 'SHORTEST' | 'BALANCED';
  transportMode?: 'DRIVING' | 'WALKING' | 'CYCLING';
}

export interface GeocodeResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  properties?: any;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (userData: { name: string; email: string; password: string }) => Promise<void>;
  loading: boolean;
}

export interface AppContextType {
  routes: Route[];
  currentRoute: Route | null;
  addRoute: (route: Route) => void;
  setCurrentRoute: (route: Route | null) => void;
  toggleFavorite: (routeId: string) => Promise<void>;
  deleteRoute: (routeId: string) => Promise<void>;
  refreshRoutes: () => Promise<void>;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

// Spring Boot API Response Types
export interface SpringBootAuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: number;
    name: string;
    email: string;
    createdAt: string;
  };
}

export interface SpringBootRouteResponse {
  id: number;
  fromLatitude: number;
  fromLongitude: number;
  fromAddress: string;
  toLatitude: number;
  toLongitude: number;
  toAddress: string;
  distance: number;
  duration: number;
  coordinates: [number, number][];
  routeType: 'FASTEST' | 'SHORTEST' | 'BALANCED';
  transportMode: 'DRIVING' | 'WALKING' | 'CYCLING';
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SpringBootLocationResponse {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  category?: string;
  popular?: boolean;
}

export interface NavigationSession {
  id: number;
  routeId: number;
  status: 'ACTIVE' | 'COMPLETED' | 'STOPPED';
  startTime: string;
  endTime?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  distanceTraveled?: number;
  estimatedTimeRemaining?: number;
}

export interface NavigationStats {
  totalNavigations: number;
  totalDistanceTraveled: number;
  totalTimeNavigated: number;
  averageSpeed: number;
  completedNavigations: number;
  favoriteRoutes: number;
}