// src/config/environment.ts
export const config = {
  // Spring Boot Backend Configuration
  api: {
    // Change this to your Spring Boot backend URL
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://move-server-66eb.onrender.com/api',
    timeout: 30000, // 30 seconds
    // For production, use your domain
    // baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://your-domain.com/api',
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

  // Authentication Configuration
  auth: {
    // OTP Configuration
    otp: {
      // OTP length
      length: 6,
      // OTP expiry time (minutes)
      expiryTime: 5,
      // Resend OTP cooldown (seconds)
      resendCooldown: 30,
      // Maximum OTP attempts
      maxAttempts: 3,
    },
    // Token configuration
    token: {
      // Access token expiry (hours)
      accessTokenExpiry: 24,
      // Refresh token expiry (days)
      refreshTokenExpiry: 7,
      // Auto-refresh interval (minutes)
      refreshInterval: 20,
    },
    // Quick login configuration
    quickLogin: {
      // Enable quick login for development/testing
      enabled: import.meta.env.DEV,
      // Session duration for quick login (hours)
      sessionDuration: 2,
    },
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
    // Enable OTP authentication
    enableOTPAuth: true,
    // Enable email/password authentication
    enableEmailAuth: true,
    // Enable quick login (for testing)
    enableQuickLogin: import.meta.env.DEV,
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
      form: 300,
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
    // Form configuration
    forms: {
      // Show validation errors immediately
      immediateValidation: false,
      // Auto-clear errors on input
      autoClearErrors: true,
      // Show password strength indicator
      showPasswordStrength: true,
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

  // Validation rules
  validation: {
    // Email validation regex
    emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    // Phone number validation regex (Indian format)
    phoneRegex: /^[6-9]\d{9}$/,
    // Password requirements
    password: {
      minLength: 6,
      maxLength: 128,
      requireUppercase: false,
      requireLowercase: false,
      requireNumbers: false,
      requireSpecialChars: false,
    },
    // Name validation
    name: {
      minLength: 2,
      maxLength: 50,
      allowSpecialChars: false,
    },
  },

  // Development/Debug settings
  debug: {
    // Log API requests in development
    logApiRequests: import.meta.env.DEV,
    // Log routing calculations
    logRouteCalculations: import.meta.env.DEV,
    // Log authentication flows
    logAuth: import.meta.env.DEV,
    // Enable Redux DevTools
    enableDevTools: import.meta.env.DEV,
    // Mock OTP for development
    mockOTP: import.meta.env.DEV,
    // Default mock OTP value
    defaultMockOTP: '123456',
  },
};

// Environment-specific overrides
const environment = import.meta.env.MODE || 'development';

if (environment === 'production') {
  // Production-specific configuration
  config.app.searchDebounceDelay = 500; // Slower debounce for production
  config.debug.logApiRequests = false;
  config.debug.logRouteCalculations = false;
  config.debug.logAuth = false;
  config.debug.mockOTP = false;
  config.errors.showNotifications = false; // Handle errors more gracefully in production
  config.auth.quickLogin.enabled = false; // Disable quick login in production
  config.features.enableQuickLogin = false;
} else if (environment === 'development') {
  // Development-specific configuration
  config.app.searchDebounceDelay = 100; // Faster debounce for development
  config.auth.otp.resendCooldown = 10; // Shorter cooldown for testing
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
  auth: {
    otp: {
      length: number;
      expiryTime: number;
      resendCooldown: number;
      maxAttempts: number;
    };
    token: {
      accessTokenExpiry: number;
      refreshTokenExpiry: number;
      refreshInterval: number;
    };
    quickLogin: {
      enabled: boolean;
      sessionDuration: number;
    };
  };
  features: Record<string, boolean>;
  app: Record<string, number>;
  ui: {
    animations: Record<string, number>;
    breakpoints: Record<string, number>;
    theme: Record<string, boolean>;
    forms: Record<string, boolean>;
  };
  validation: {
    emailRegex: RegExp;
    phoneRegex: RegExp;
    password: Record<string, number | boolean>;
    name: Record<string, number | boolean>;
  };
  errors: {
    showNotifications: boolean;
    autoHideDelay: number;
    retryAttempts: number;
    retryDelay: number;
  };
  debug: Record<string, boolean | string>;
}