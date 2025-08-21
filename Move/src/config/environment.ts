// src/config/environment.ts
export const config = {
  // Spring Boot Backend Configuration
  api: {
    // Change this to your Spring Boot backend URL
    baseUrl: process.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
    timeout: 30000, // 30 seconds
    // For production, use your domain
    // baseUrl: process.env.VITE_API_BASE_URL || 'https://your-domain.com/api',
  },

  // MapTiler API Configuration (fallback for geocoding)
  maptiler: {
    apiKey: 'Fh0gANs6ihPBqlLpsjIm',
    baseUrl: 'https://api.maptiler.com',
    // Different map styles available
    mapStyles: {
      streets: 'streets-v2',
      streetsDark: 'streets-v2-dark',
      satellite: 'hybrid',
      terrain: 'outdoor-v2',
      basic: 'basic-v2',
    },
    // India-focused configuration
    defaultBounds: {
      // Bounding box for India
      southwest: { lat: 6.4627, lng: 68.1097 },
      northeast: { lat: 35.5137, lng: 97.3953 }
    },
    // Major Indian cities for proximity-based searches
    proximityPoints: {
      pune: { lat: 18.5204, lng: 73.8567 },
      mumbai: { lat: 19.0760, lng: 72.8777 },
      delhi: { lat: 28.7041, lng: 77.1025 },
      bangalore: { lat: 12.9716, lng: 77.5946 },
      hyderabad: { lat: 17.3850, lng: 78.4867 },
      chennai: { lat: 13.0827, lng: 80.2707 },
      kolkata: { lat: 22.5726, lng: 88.3639 },
      ahmedabad: { lat: 23.0225, lng: 72.5714 },
    },
    // Default center point (Pune)
    defaultCenter: { lat: 18.5204, lng: 73.8567 },
    defaultZoom: 12,
    maxZoom: 20,
  },

  // Feature flags
  features: {
    // Enable detailed routing instructions
    enableDetailedInstructions: true,
    // Enable route history persistence via backend
    enableBackendSync: true,
    // Enable real-time navigation
    enableNavigation: true,
    // Enable route favorites
    enableFavorites: true,
    // Enable offline mode (future feature)
    enableOfflineMode: false,
    // Enable real-time traffic data
    enableTrafficData: false,
  },

  // Application settings
  app: {
    // Maximum number of routes to display in history
    maxRouteHistory: 20,
    // Search debounce delay (ms)
    searchDebounceDelay: 300,
    // Geolocation timeout (ms)
    geolocationTimeout: 15000,
    // Maximum age for cached location (ms)
    geolocationMaxAge: 300000, // 5 minutes
    // Auto-refresh interval for routes (ms)
    routeRefreshInterval: 300000, // 5 minutes
  },

  // UI Configuration
  ui: {
    // Animation durations (ms)
    animations: {
      sidebar: 300,
      search: 200,
      route: 500,
      modal: 200,
    },
    // Responsive breakpoints
    breakpoints: {
      mobile: 640,
      tablet: 768,
      desktop: 1024,
    },
    // Theme configuration
    theme: {
      // Store theme preference
      persistTheme: true,
      // Use system theme as default
      useSystemTheme: true,
    },
  },

  // Error handling
  errors: {
    // Show error notifications
    showNotifications: true,
    // Auto-hide error messages after (ms)
    autoHideDelay: 5000,
    // Retry attempts for failed requests
    retryAttempts: 3,
    // Retry delay (ms)
    retryDelay: 1000,
  },

  // Development/Debug settings
  debug: {
    // Log API requests in development
    logApiRequests: process.env.NODE_ENV === 'development',
    // Log routing calculations
    logRouteCalculations: process.env.NODE_ENV === 'development',
    // Enable Redux DevTools
    enableDevTools: process.env.NODE_ENV === 'development',
  },
};

// Environment-specific overrides
const environment = process.env.NODE_ENV || 'development';

if (environment === 'production') {
  // Production-specific configuration
  config.app.searchDebounceDelay = 500; // Slower debounce for production
  config.debug.logApiRequests = false;
  config.debug.logRouteCalculations = false;
  config.errors.showNotifications = false; // Handle errors more gracefully in production
} else if (environment === 'development') {
  // Development-specific configuration
  config.app.searchDebounceDelay = 100; // Faster debounce for development
}

// Validation
if (!config.maptiler.apiKey) {
  console.warn('MapTiler API key not configured. Some features may not work.');
}

export default config;

// Type definitions for configuration
export interface Config {
  api: {
    baseUrl: string;
    timeout: number;
  };
  maptiler: {
    apiKey: string;
    baseUrl: string;
    mapStyles: Record<string, string>;
    defaultBounds: {
      southwest: { lat: number; lng: number };
      northeast: { lat: number; lng: number };
    };
    proximityPoints: Record<string, { lat: number; lng: number }>;
    defaultCenter: { lat: number; lng: number };
    defaultZoom: number;
    maxZoom: number;
  };
  features: Record<string, boolean>;
  app: Record<string, number>;
  ui: {
    animations: Record<string, number>;
    breakpoints: Record<string, number>;
    theme: Record<string, boolean>;
  };
  errors: {
    showNotifications: boolean;
    autoHideDelay: number;
    retryAttempts: number;
    retryDelay: number;
  };
  debug: Record<string, boolean>;
}