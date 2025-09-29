import axios from 'axios';
import config from '../config/environment';

const BASE_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: config.api.baseUrl || BASE_URL + '/api',
  timeout: config.api.timeout || 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear invalid tokens
      localStorage.removeItem('auth_token');
      localStorage.removeItem('mapguide_user');
      
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// ============= AUTH SERVICE =============
export const authService = {
  // Sign in
  async signin(credentials: { email: string; password: string }) {
    try {
      const response = await api.post('/auth/signin', credentials);
      return response.data.data;
    } catch (error: any) {
      console.error('Signin error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  // Basic signup (without OTP) - for backward compatibility
  async signup(userData: { name: string; email: string; password: string }) {
    try {
      const response = await api.post('/auth/signup', userData);
      return response.data.data;
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.response?.data?.message || 'Signup failed');
    }
  },

  // Send OTP for signup
  async sendSignupOTP(email: string) {
    try {
      const response = await api.post('/auth/otp/signup/send', { email });
      return response.data.data;
    } catch (error: any) {
      console.error('Send signup OTP error:', error);
      throw new Error(error.response?.data?.message || 'Failed to send OTP');
    }
  },

  // Complete signup with OTP
  async signupWithOTP(signupData: { name: string; email: string; password: string; otp: string }) {
    try {
      const response = await api.post('/auth/signup/with-otp', signupData);
      return response.data.data;
    } catch (error: any) {
      console.error('Signup with OTP error:', error);
      throw new Error(error.response?.data?.message || 'Signup failed');
    }
  },

  // Just verify OTP (non-consuming)
  async verifySignupOTP(email: string, otp: string) {
    try {
      const response = await api.post('/auth/otp/signup/verify', { email, otp });
      return response.data.data;
    } catch (error: any) {
      console.error('Verify signup OTP error:', error);
      throw new Error(error.response?.data?.message || 'OTP verification failed');
    }
  },

  // Send password reset OTP
  async sendPasswordResetOTP(email: string) {
    try {
      const response = await api.post('/auth/otp/password-reset/send', { email });
      return response.data.data;
    } catch (error: any) {
      console.error('Send password reset OTP error:', error);
      throw new Error(error.response?.data?.message || 'Failed to send password reset OTP');
    }
  },

  // Verify password reset OTP
  async verifyPasswordResetOTP(email: string, otp: string) {
    try {
      const response = await api.post('/auth/otp/password-reset/verify', { email, otp });
      return response.data.data;
    } catch (error: any) {
      console.error('Verify password reset OTP error:', error);
      throw new Error(error.response?.data?.message || 'Failed to verify password reset OTP');
    }
  },

  // Reset password with OTP
  async resetPassword(data: { email: string; otp: string; newPassword: string }) {
    try {
      const response = await api.post('/auth/password/reset', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw new Error(error.response?.data?.message || 'Failed to reset password');
    }
  },

  // Signout
  signout: async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        await api.post('/auth/signout', {}, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Signout request failed:', error);
      }
    }
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('mapguide_user');
  },

  // Refresh token
  async refresh(token: string) {
    try {
      const response = await api.post('/auth/refresh', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Token refresh error:', error);
      throw new Error('Token refresh failed');
    }
  },

  // Get profile
  getProfile: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data.data;
    } catch (error: any) {
      console.error('Error getting profile:', error);
      throw new Error(error.response?.data?.message || 'Failed to get profile');
    }
  },

  // Update profile
  updateProfile: async (data: { name?: string; avatarUrl?: string }) => {
    try {
      const response = await api.put('/auth/me', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },

  // Validate token
  validateToken: async (token: string) => {
    try {
      const response = await api.post('/auth/validate', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Token validation error:', error);
      throw new Error(error.response?.data?.message || 'Token validation failed');
    }
  },
};

// ============= OTP SERVICE =============
export const otpService = {
  // Send OTP
  async sendOTP(email: string, type: 'SIGNUP_VERIFICATION' | 'PASSWORD_RESET' = 'SIGNUP_VERIFICATION') {
    try {
      const response = await api.post('/otp/send', {
        email: email,
        type: type
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Send OTP error:', error);
      throw new Error(error.response?.data?.message || 'Failed to send OTP');
    }
  },

  // Verify OTP
  async verifyOTP(data: { email: string; otp: string; type?: string }) {
    try {
      const response = await api.post('/otp/verify', {
        email: data.email,
        otp: data.otp,
        type: data.type || 'SIGNUP_VERIFICATION'
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      throw new Error(error.response?.data?.message || 'OTP verification failed');
    }
  },

  // Signup with OTP
  async signupWithOtp(data: { name: string; email: string; password: string; otp: string }) {
    try {
      const response = await api.post('/otp/signup-with-otp', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Signup with OTP error:', error);
      throw new Error(error.response?.data?.message || 'Failed to complete signup');
    }
  },

  // Get OTP status
  getOtpStatus: async (email: string) => {
    try {
      const response = await api.get(`/otp/status/${encodeURIComponent(email)}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error getting OTP status:', error);
      throw new Error(error.response?.data?.message || 'Failed to get OTP status');
    }
  },
};

// ============= GEOCODE SERVICE =============
export const geocodeService = {
  async search(query: string) {
    try {
      // First try backend API
      const response = await api.get('/geocoding/search', {
        params: { query }
      });
      
      if (response.data.success && response.data.data) {
        return response.data.data.map((item: any) => ({
          place_id: item.place_id,
          display_name: item.display_name,
          lat: item.lat,
          lon: item.lon
        }));
      }
    } catch (error) {
      console.warn('Backend geocoding failed, trying direct Nominatim:', error);
    }

    // Fallback to direct Nominatim API
    try {
      const nominatimResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: query,
          format: 'json',
          addressdetails: 1,
          limit: 5,
          countrycodes: 'in'
        },
        headers: {
          'User-Agent': 'MapGuide-App/1.0'
        }
      });
      
      return nominatimResponse.data || [];
    } catch (error) {
      console.error('Geocoding search failed:', error);
      return [];
    }
  },

  reverseGeocode: async (lat: number, lng: number) => {
    try {
      const response = await api.get('/geocoding/reverse', {
        params: { lat, lng }
      });
      return response.data.data;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      
      try {
        const fallbackResponse = await axios.get('https://nominatim.openstreetmap.org/reverse', {
          params: {
            lat,
            lon: lng,
            format: 'json',
            addressdetails: '1'
          },
          timeout: 5000
        });
        
        return {
          display_name: fallbackResponse.data.display_name,
          address: fallbackResponse.data.display_name,
          lat: lat,
          lng: lng
        };
      } catch (fallbackError) {
        console.error('Fallback reverse geocoding failed:', fallbackError);
        throw new Error('Failed to reverse geocode location');
      }
    }
  },

  getSuggestions: async (query: string) => {
    try {
      const response = await api.get('/geocoding/suggestions', {
        params: { query }
      });
      return response.data.data;
    } catch (error) {
      console.error('Location suggestions error:', error);
      try {
        return await geocodeService.search(query);
      } catch (fallbackError) {
        throw new Error('Failed to get location suggestions');
      }
    }
  },
};

// ============= LOCATION SERVICE =============
export const locationService = {
  searchLocations: async (query: string, page = 0, size = 20) => {
    try {
      const response = await api.get('/locations/search', {
        params: { query, page, size }
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error searching locations:', error);
      throw new Error(error.response?.data?.message || 'Failed to search locations');
    }
  },

  getPopularLocations: async () => {
    try {
      const response = await api.get('/locations/popular');
      return response.data.data;
    } catch (error: any) {
      console.error('Error getting popular locations:', error);
      throw new Error(error.response?.data?.message || 'Failed to get popular locations');
    }
  },

  getLocationsByCategory: async (category: string) => {
    try {
      const response = await api.get(`/locations/category/${category}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error getting locations by category:', error);
      throw new Error(error.response?.data?.message || 'Failed to get locations by category');
    }
  },

  getNearbyLocations: async (latitude: number, longitude: number, radius = 5) => {
    try {
      const response = await api.get('/locations/nearby', {
        params: { latitude, longitude, radius }
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error getting nearby locations:', error);
      throw new Error(error.response?.data?.message || 'Failed to get nearby locations');
    }
  },

  reverseGeocode: async (latitude: number, longitude: number) => {
    try {
      const response = await api.get('/locations/reverse', {
        params: { latitude, longitude }
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error reverse geocoding:', error);
      throw new Error(error.response?.data?.message || 'Failed to reverse geocode');
    }
  },

  // Live location features
  updateLiveLocation: async (data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    bearing?: number;
    altitude?: number;
  }) => {
    try {
      const response = await api.post('/locations/live/update', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating live location:', error);
      throw new Error(error.response?.data?.message || 'Failed to update live location');
    }
  },

  getCurrentLocation: async () => {
    try {
      const response = await api.get('/locations/live/current');
      return response.data.data;
    } catch (error: any) {
      console.error('Error getting current location:', error);
      throw new Error(error.response?.data?.message || 'Failed to get current location');
    }
  },

  toggleLocationSharing: async (enabled: boolean) => {
    try {
      const response = await api.post('/locations/live/share', { enabled });
      return response.data.data;
    } catch (error: any) {
      console.error('Error toggling location sharing:', error);
      throw new Error(error.response?.data?.message || 'Failed to toggle location sharing');
    }
  },

  stopLocationSharing: async () => {
    try {
      const response = await api.post('/locations/live/stop');
      return response.data.data;
    } catch (error: any) {
      console.error('Error stopping location sharing:', error);
      throw new Error(error.response?.data?.message || 'Failed to stop location sharing');
    }
  },
};

// ============= ROUTE SERVICE =============
export const routeService = {
  async getRoute(from: { lat: number; lng: number; address: string }, to: { lat: number; lng: number; address: string }) {
    try {
      const response = await api.post('/routes/calculate', {
        from: {
          lat: from.lat,
          lng: from.lng,
          address: from.address
        },
        to: {
          lat: to.lat,
          lng: to.lng,
          address: to.address
        },
        routeType: 'FASTEST',
        transportMode: 'DRIVING'
      });

      if (response.data.success) {
        const routeData = response.data.data;
        return {
          distance: routeData.distance,
          duration: routeData.duration,
          coordinates: routeData.coordinates.map((coord: { lat: number; lng: number }) => [coord.lat, coord.lng])
        };
      } else {
        throw new Error(response.data.message || 'Route calculation failed');
      }
    } catch (error: any) {
      console.error('Route calculation error:', error);
      
      // Fallback to OSRM directly
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
        const osrmResponse = await axios.get(osrmUrl);
        
        if (osrmResponse.data.code === 'Ok' && osrmResponse.data.routes.length > 0) {
          const route = osrmResponse.data.routes[0];
          const coordinates = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
          
          return {
            distance: route.distance,
            duration: route.duration,
            coordinates
          };
        }
      } catch (osrmError) {
        console.error('OSRM fallback failed:', osrmError);
      }
      
      throw new Error(error.response?.data?.message || 'Failed to calculate route');
    }
  },

  async calculate(routeRequest: {
    fromLatitude: number;
    fromLongitude: number;
    fromAddress: string;
    toLatitude: number;
    toLongitude: number;
    toAddress: string;
    routeType: 'FASTEST' | 'SHORTEST' | 'BALANCED';
    transportMode: 'DRIVING' | 'WALKING' | 'CYCLING';
  }) {
    try {
      const response = await api.post('/routes/save', routeRequest);
      return response.data.data;
    } catch (error: any) {
      console.error('Save route error:', error);
      throw new Error(error.response?.data?.message || 'Failed to save route');
    }
  },

  async getUserRoutes(page = 0, size = 10) {
    try {
      const response = await api.get('/routes/user', {
        params: { page, size }
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Get user routes error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch routes');
    }
  },

  getRouteById: async (routeId: number) => {
    try {
      const response = await api.get(`/routes/${routeId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching route:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch route');
    }
  },

  async toggleFavorite(routeId: number) {
    try {
      const response = await api.put(`/routes/${routeId}/favorite`);
      return response.data.data;
    } catch (error: any) {
      console.error('Toggle favorite error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update favorite');
    }
  },

  async deleteRoute(routeId: number) {
    try {
      const response = await api.delete(`/routes/${routeId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Delete route error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete route');
    }
  },

  getFavoriteRoutes: async (page = 0, size = 20) => {
    try {
      const response = await api.get('/routes/favorites', {
        params: { page, size }
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching favorite routes:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch favorite routes');
    }
  },
};

// ============= NAVIGATION SERVICE =============
export const navigationService = {
  startNavigation: async (data: { routeId: number; startLatitude?: number; startLongitude?: number }) => {
    try {
      const response = await api.post('/navigation/start', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error starting navigation:', error);
      throw new Error(error.response?.data?.message || 'Failed to start navigation');
    }
  },

  updateLocation: async (data: { 
    sessionId: number; 
    currentLatitude: number; 
    currentLongitude: number; 
    currentSpeed?: number;
    timestamp?: string 
  }) => {
    try {
      const response = await api.put('/navigation/update', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating location:', error);
      throw new Error(error.response?.data?.message || 'Failed to update location');
    }
  },

  completeNavigation: async (sessionId: number) => {
    try {
      const response = await api.put(`/navigation/complete/${sessionId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error completing navigation:', error);
      throw new Error(error.response?.data?.message || 'Failed to complete navigation');
    }
  },

  stopNavigation: async (sessionId: number) => {
    try {
      const response = await api.delete(`/navigation/stop/${sessionId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error stopping navigation:', error);
      throw new Error(error.response?.data?.message || 'Failed to stop navigation');
    }
  },

  getNavigationStatus: async () => {
    try {
      const response = await api.get('/navigation/status');
      return response.data.data;
    } catch (error: any) {
      console.error('Error getting navigation status:', error);
      throw new Error(error.response?.data?.message || 'Failed to get navigation status');
    }
  },

  getNavigationHistory: async (page = 0, size = 20) => {
    try {
      const response = await api.get('/navigation/history', {
        params: { page, size }
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching navigation history:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch navigation history');
    }
  },

  getNavigationStats: async () => {
    try {
      const response = await api.get('/navigation/stats');
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching navigation stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch navigation stats');
    }
  },
};

export default api;