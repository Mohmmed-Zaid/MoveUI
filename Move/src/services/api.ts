import axios from 'axios';

const BASE_URL = 'http://localhost:8080';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
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
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If token expired and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const currentToken = localStorage.getItem('auth_token');
        
        if (currentToken) {
          const response = await axios.post(`${BASE_URL}/api/auth/refresh`, {}, {
            headers: {
              'Authorization': `Bearer ${currentToken}`
            }
          });

          const { accessToken } = response.data;
          localStorage.setItem('auth_token', accessToken);
          
          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('mapguide_user');
        
        // Only redirect if we're not already on the login page
        if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
          window.location.href = '/';
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  signup: async (data: { name: string; email: string; password: string }) => {
    const response = await api.post('/api/auth/signup', data);
    return response.data;
  },

  signin: async (data: { email: string; password: string }) => {
    const response = await api.post('/api/auth/signin', data);
    return response.data;
  },

  signout: async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        await api.post('/api/auth/signout', {}, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Signout request failed:', error);
        // Continue with local cleanup even if server request fails
      }
    }
    
    // Always clean up local storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('mapguide_user');
  },

  refresh: async (token: string) => {
    const response = await api.post('/api/auth/refresh', {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

export const geocodeService = {
  search: async (query: string) => {
    try {
      // Try backend first
      const response = await api.get('/api/geocoding/search', {
        params: {
          query: query
        }
      });
      return response.data;
    } catch (error) {
      console.error('Geocoding error:', error);
      
      // Fallback to Nominatim directly if backend fails
      try {
        const fallbackResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: {
            q: query,
            format: 'json',
            addressdetails: '1',
            limit: '5',
            countrycodes: 'in'
          },
          // REMOVED User-Agent header - browsers block this
          timeout: 5000
        });
        
        // Transform Nominatim response to match expected format
        const transformedData = fallbackResponse.data.map((item: any) => ({
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          address: item.display_name,
          importance: item.importance || 0
        }));
        
        return transformedData;
      } catch (fallbackError) {
        console.error('Fallback geocoding failed:', fallbackError);
        throw new Error('Failed to search locations. Please check your internet connection.');
      }
    }
  },

  reverseGeocode: async (lat: number, lng: number) => {
    try {
      // Try backend first
      const response = await api.get('/api/geocoding/reverse', {
        params: {
          lat,
          lng
        }
      });
      return response.data;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      
      // Fallback to Nominatim directly
      try {
        const fallbackResponse = await axios.get('https://nominatim.openstreetmap.org/reverse', {
          params: {
            lat,
            lon: lng,
            format: 'json',
            addressdetails: '1'
          },
          // REMOVED User-Agent header
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
      const response = await api.get('/api/geocoding/suggestions', {
        params: {
          query: query
        }
      });
      return response.data;
    } catch (error) {
      console.error('Location suggestions error:', error);
      // Fallback to search if suggestions endpoint fails
      try {
        return await geocodeService.search(query);
      } catch (fallbackError) {
        throw new Error('Failed to get location suggestions');
      }
    }
  },
};

export const routeService = {
  getRoute: async (from: any, to: any) => {
    try {
      // Try backend first
      const response = await api.post('/api/routes/calculate', {
        from: {
          lat: from.lat,
          lng: from.lng,
          address: from.address
        },
        to: {
          lat: to.lat,
          lng: to.lng,
          address: to.address
        }
      });
      return response.data;
    } catch (error) {
      console.error('Backend routing failed, trying OSRM:', error);
      
      // Fallback to OSRM public API
      try {
        const osrmResponse = await axios.get(
          `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}`,
          {
            params: {
              overview: 'full',
              geometries: 'geojson',
              steps: true
            },
            timeout: 15000, // Increased timeout
          }
        );

        if (!osrmResponse.data.routes || osrmResponse.data.routes.length === 0) {
          throw new Error('No routes found');
        }

        const route = osrmResponse.data.routes[0];
        return {
          distance: route.distance,
          duration: route.duration,
          coordinates: route.geometry.coordinates.map((coord: number[]) => ({
            lat: coord[1],
            lng: coord[0]
          })),
          steps: route.legs[0]?.steps || []
        };
      } catch (osrmError) {
        console.error('OSRM routing failed:', osrmError);
        throw new Error('Failed to calculate route. Please try again.');
      }
    }
  },

  calculate: async (routeRequest: any) => {
    try {
      const response = await api.post('/api/routes/calculate', routeRequest);
      return response.data;
    } catch (error) {
      console.error('Route calculation failed:', error);
      throw new Error('Failed to calculate and save route');
    }
  },

  getUserRoutes: async (page = 0, size = 20) => {
    try {
      const response = await api.get('/api/routes/user', {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user routes:', error);
      throw new Error('Failed to fetch user routes');
    }
  },

  toggleFavorite: async (routeId: number) => {
    try {
      const response = await api.put(`/api/routes/${routeId}/favorite`);
      return response.data;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw new Error('Failed to update favorite status');
    }
  },

  deleteRoute: async (routeId: number) => {
    try {
      const response = await api.delete(`/api/routes/${routeId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting route:', error);
      throw new Error('Failed to delete route');
    }
  },
};

// Navigation service
export const navigationService = {
  startNavigation: async (data: { routeId: number }) => {
    try {
      const response = await api.post('/api/navigation/start', data);
      return response.data;
    } catch (error) {
      console.error('Error starting navigation:', error);
      throw new Error('Failed to start navigation');
    }
  },

  updateLocation: async (data: { sessionId: number; latitude: number; longitude: number; timestamp: string }) => {
    try {
      const response = await api.put('/api/navigation/update', data);
      return response.data;
    } catch (error) {
      console.error('Error updating location:', error);
      throw new Error('Failed to update location');
    }
  },

  completeNavigation: async (sessionId: number) => {
    try {
      const response = await api.put(`/api/navigation/complete/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Error completing navigation:', error);
      throw new Error('Failed to complete navigation');
    }
  },

  stopNavigation: async (sessionId: number) => {
    try {
      const response = await api.delete(`/api/navigation/stop/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Error stopping navigation:', error);
      throw new Error('Failed to stop navigation');
    }
  },

  getNavigationStatus: async () => {
    try {
      const response = await api.get('/api/navigation/status');
      return response.data;
    } catch (error) {
      console.error('Error getting navigation status:', error);
      throw new Error('Failed to get navigation status');
    }
  },

  getNavigationHistory: async (page = 0, size = 20) => {
    try {
      const response = await api.get('/api/navigation/history', {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching navigation history:', error);
      throw new Error('Failed to fetch navigation history');
    }
  },

  getNavigationStats: async () => {
    try {
      const response = await api.get('/api/navigation/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching navigation stats:', error);
      throw new Error('Failed to fetch navigation stats');
    }
  },
};

export default api;