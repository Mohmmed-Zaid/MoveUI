// src/types/index.ts

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  isAuthenticated: boolean;
  createdAt: string;
  avatarUrl?: string;
  providerId?: string;
  authProvider?: string;
  emailVerified?: boolean;
}

// Authentication Types
export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  sendOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  quickLogin: () => Promise<void>;
  loading: boolean;
  setUser: (user: User | null) => void;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: number;
    name: string;
    email: string;
    createdAt: string;
    avatarUrl?: string;
    emailVerified?: boolean;
  };
}

// Route Types
export interface Route {
  id: string;
  from: LocationPoint;
  to: LocationPoint;
  distance: number;
  duration: number;
  coordinates: [number, number][];
  timestamp: string;
  isFavorite?: boolean;
  routeType?: 'FASTEST' | 'SHORTEST' | 'BALANCED';
  transportMode?: 'DRIVING' | 'WALKING' | 'CYCLING';
}

export interface LocationPoint {
  lat: number;
  lng: number;
  address: string;
}

export interface RouteRequest {
  fromLatitude: number;
  fromLongitude: number;
  fromAddress: string;
  toLatitude: number;
  toLongitude: number;
  toAddress: string;
  routeType: 'FASTEST' | 'SHORTEST' | 'BALANCED';
  transportMode: 'DRIVING' | 'WALKING' | 'CYCLING';
}

export interface RouteResponse {
  id?: number;
  distance: number;
  duration: number;
  coordinates: [number, number][];
  createdAt?: string;
  favorite?: boolean;
  routeType?: 'FASTEST' | 'SHORTEST' | 'BALANCED';
  transportMode?: 'DRIVING' | 'WALKING' | 'CYCLING';
  fromLatitude?: number;
  fromLongitude?: number;
  fromAddress?: string;
  toLatitude?: number;
  toLongitude?: number;
  toAddress?: string;
}

// App Context Types
export interface AppContextType {
  routes: Route[];
  currentRoute: Route | null;
  addRoute: (route: Route) => Promise<void>;
  setCurrentRoute: (route: Route | null) => void;
  toggleFavorite: (routeId: string) => Promise<void>;
  deleteRoute: (routeId: string) => Promise<void>;
  refreshRoutes: () => Promise<void>;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

// Geocoding Types
export interface GeocodeResult {
  place_id?: string;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

// Theme Types
export interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

// Error Types
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  timestamp?: number;
}

// Location Types
export interface LocationDto {
  id?: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category?: string;
  description?: string;
  isPopular?: boolean;
}

// OTP Types
export interface OTPRequest {
  email: string;
  type: 'SIGNUP_VERIFICATION' | 'PASSWORD_RESET';
}

export interface OTPResponse {
  success: boolean;
  message: string;
  otpSent?: boolean;
  expiryTime?: number;
  remainingAttempts?: number;
  email?: string;
  type?: string;
  expiresInMinutes?: number;
  nextAllowedTime?: number;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Component Props Types
export interface RouteInputProps {
  from: string;
  to: string;
  onFromChange: (value: string, coordinates?: { lat: number; lng: number }) => void;
  onToChange: (value: string, coordinates?: { lat: number; lng: number }) => void;
  onFindRoute: () => void;
  loading: boolean;
}

export interface RouteHistoryProps {
  routes: Route[];
  onSelectRoute: (route: Route) => void;
  className?: string;
}

export interface MapComponentProps {
  route: Route | null;
  className?: string;
}

// Navigation Types
export interface NavigationRequest {
  routeId: number;
}

export interface LocationUpdateRequest {
  sessionId: number;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
}

export interface NavigationResponse {
  sessionId: number;
  routeId: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  startTime: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  progress?: {
    distanceCovered: number;
    timeElapsed: number;
    estimatedTimeRemaining: number;
  };
}

export interface NavigationStatusResponse {
  hasActiveNavigation: boolean;
  activeSession?: NavigationResponse;
}

export interface NavigationStatsResponse {
  totalNavigations: number;
  totalDistance: number;
  totalTime: number;
  averageSpeed: number;
  mostUsedRoutes: Array<{
    routeId: number;
    count: number;
    fromAddress: string;
    toAddress: string;
  }>;
}