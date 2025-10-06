import axios from 'axios';
import config from '../config/environment';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://move-server-66eb.onrender.com';
const API_BASE = config.api.baseUrl || BASE_URL + '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: config.api.timeout || 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fetch with retry helper for critical endpoints
const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 2): Promise<Response> => {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 seconds for cold start

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      // If response is ok, return it
      if (response.ok || response.status >= 400) {
        return response;
      }

      // If server error and we have retries left, retry
      if (i < maxRetries && response.status >= 500) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
        continue;
      }

      return response;
    } catch (error: any) {
      // If it's the last retry or not a timeout, throw
      if (i === maxRetries || error.name !== 'AbortError') {
        if (error.name === 'AbortError') {
          throw new Error('Server is taking too long to respond. The free tier server may be starting up. Please wait 30 seconds and try again.');
        }
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 3000 * (i + 1)));
    }
  }
  
  throw new Error('Max retries exceeded');
};

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
  // Sign in with retry logic
  async signin(credentials: { email: string; password: string }) {
    try {
      const response = await fetchWithRetry(
        `${API_BASE}/auth/signin`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      return data.data;
    } catch (error: any) {
      console.error('Signin error:', error);
      throw new Error(error.message || 'Login failed');
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

  async sendSignupOTP(email: string) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(`${API_BASE_URL}/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(),
          type: 'SIGNUP_VERIFICATION'
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again.');
      }
      throw error;
    }
  },

  // Signup with OTP - FIXED ENDPOINT
  async signupWithOTP(userData: { name: string; email: string; password: string; otp: string }) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      console.log('Sending signup request to:', `${API_BASE_URL}/otp/signup-with-otp`);
      console.log('Request data:', { 
        name: userData.name, 
        email: userData.email,
        otp: userData.otp.trim()
      });

      const response = await fetch(`${API_BASE_URL}/otp/signup-with-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userData.name.trim(),
          email: userData.email.trim().toLowerCase(),
          password: userData.password,
          otp: userData.otp.trim().replace(/\s+/g, '') // Remove all spaces
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      console.log('Signup response status:', response.status);
      console.log('Signup response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      // Return the AuthResponse which contains accessToken and user
      return data.data; // The actual AuthResponse is in data.data
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('Signup with OTP error:', error);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again.');
      }
      throw error;
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
  async signout() {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        await fetch(`${API_BASE}/auth/signout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
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

  // Refresh token with retry
  async refresh(token: string) {
    try {
      const response = await fetchWithRetry(
        `${API_BASE}/auth/refresh`,
        {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      return data.data;
    } catch (error: any) {
      console.error('Token refresh error:', error);
      throw new Error('Token refresh failed');
    }
  },

  // Get profile
  async getProfile() {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get profile');
      }

      return data.data;
    } catch (error: any) {
      console.error('Error getting profile:', error);
      throw new Error(error.message || 'Failed to get profile');
    }
  },

  // Update profile
  async updateProfile(profileData: { name?: string; avatarUrl?: string }) {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/auth/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      return data.data;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  },

  // Validate token
  async validateToken(token: string) {
    try {
      const response = await fetch(`${API_BASE}/auth/validate`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Token validation failed');
      }

      return data.data;
    } catch (error: any) {
      console.error('Token validation error:', error);
      throw new Error('Token validation failed');
    }
  },
};

export const otpService = {

  async sendOTP(email: string, type: 'SIGNUP_VERIFICATION' | 'PASSWORD_RESET' = 'SIGNUP_VERIFICATION') {
    console.warn('otpService.sendOTP is deprecated. Use authService.sendSignupOTP or authService.sendPasswordResetOTP instead');
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

  async verifyOTP(data: { email: string; otp: string; type?: string }) {
    console.warn('otpService.verifyOTP is deprecated. Use authService.verifySignupOTP or authService.verifyPasswordResetOTP instead');
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

  async signupWithOtp(data: { name: string; email: string; password: string; otp: string }) {
    console.warn('otpService.signupWithOtp is deprecated. Use authService.signupWithOTP instead');
    try {
      const response = await api.post('/otp/signup-with-otp', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Signup with OTP error:', error);
      throw new Error(error.response?.data?.message || 'Failed to complete signup');
    }
  },
  async getOtpStatus(email: string) {
    console.warn('otpService.getOtpStatus endpoint does not exist in backend');
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

  async reverseGeocode(lat: number, lng: number) {
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

  async getSuggestions(query: string) {
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
  async searchLocations(query: string, page = 0, size = 20) {
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

  async getPopularLocations() {
    try {
      const response = await api.get('/locations/popular');
      return response.data.data;
    } catch (error: any) {
      console.error('Error getting popular locations:', error);
      throw new Error(error.response?.data?.message || 'Failed to get popular locations');
    }
  },

  async getLocationsByCategory(category: string) {
    try {
      const response = await api.get(`/locations/category/${category}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error getting locations by category:', error);
      throw new Error(error.response?.data?.message || 'Failed to get locations by category');
    }
  },

  async getNearbyLocations(latitude: number, longitude: number, radius = 5) {
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

  async reverseGeocode(latitude: number, longitude: number) {
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
  async updateLiveLocation(data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    bearing?: number;
    altitude?: number;
  }) {
    try {
      const response = await api.post('/locations/live/update', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating live location:', error);
      throw new Error(error.response?.data?.message || 'Failed to update live location');
    }
  },

  async getCurrentLocation() {
    try {
      const response = await api.get('/locations/live/current');
      return response.data.data;
    } catch (error: any) {
      console.error('Error getting current location:', error);
      throw new Error(error.response?.data?.message || 'Failed to get current location');
    }
  },

  async toggleLocationSharing(enabled: boolean) {
    try {
      const response = await api.post('/locations/live/share', { enabled });
      return response.data.data;
    } catch (error: any) {
      console.error('Error toggling location sharing:', error);
      throw new Error(error.response?.data?.message || 'Failed to toggle location sharing');
    }
  },

  async stopLocationSharing() {
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

  async getRouteById(routeId: number) {
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

  async getFavoriteRoutes(page = 0, size = 20) {
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
  async startNavigation(data: { routeId: number; startLatitude?: number; startLongitude?: number }) {
    try {
      const response = await api.post('/navigation/start', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error starting navigation:', error);
      throw new Error(error.response?.data?.message || 'Failed to start navigation');
    }
  },

  async updateLocation(data: { 
    sessionId: number; 
    currentLatitude: number; 
    currentLongitude: number; 
    currentSpeed?: number;
    timestamp?: string;
  }) {
    try {
      const response = await api.put('/navigation/update', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating location:', error);
      throw new Error(error.response?.data?.message || 'Failed to update location');
    }
  },

  async completeNavigation(sessionId: number) {
    try {
      const response = await api.put(`/navigation/complete/${sessionId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error completing navigation:', error);
      throw new Error(error.response?.data?.message || 'Failed to complete navigation');
    }
  },

  async stopNavigation(sessionId: number) {
    try {
      const response = await api.delete(`/navigation/stop/${sessionId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error stopping navigation:', error);
      throw new Error(error.response?.data?.message || 'Failed to stop navigation');
    }
  },

  async getNavigationStatus() {
    try {
      const response = await api.get('/navigation/status');
      return response.data.data;
    } catch (error: any) {
      console.error('Error getting navigation status:', error);
      throw new Error(error.response?.data?.message || 'Failed to get navigation status');
    }
  },

  async getNavigationHistory(page = 0, size = 20) {
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

  async getNavigationStats() {
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
