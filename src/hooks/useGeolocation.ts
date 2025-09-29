import { useState, useCallback } from 'react';

const MAPTILER_API_KEY = 'Fh0gANs6ihPBqlLpsjIm';

interface GeolocationResult {
  latitude: number;
  longitude: number;
  address?: string;
}

export const useGeolocation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = useCallback(async (): Promise<GeolocationResult | null> => {
    setLoading(true);
    setError(null);

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      const { latitude, longitude } = position.coords;

      // Try MapTiler reverse geocoding first
      try {
        const maptilerResponse = await fetch(
          `https://api.maptiler.com/geocoding/${longitude},${latitude}.json?key=${MAPTILER_API_KEY}`
        );
        
        if (maptilerResponse.ok) {
          const maptilerData = await maptilerResponse.json();
          if (maptilerData.features && maptilerData.features.length > 0) {
            return {
              latitude,
              longitude,
              address: maptilerData.features[0].place_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            };
          }
        }
      } catch (maptilerError) {
        console.warn('MapTiler reverse geocoding failed, trying Nominatim:', maptilerError);
      }

      // Fallback to Nominatim reverse geocoding
      try {
        const nominatimResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
        );
        
        if (nominatimResponse.ok) {
          const nominatimData = await nominatimResponse.json();
          return {
            latitude,
            longitude,
            address: nominatimData.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          };
        }
      } catch (nominatimError) {
        console.warn('Nominatim reverse geocoding failed:', nominatimError);
      }

      // If both services fail, return coordinates only
      return {
        latitude,
        longitude,
        address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
      };

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get location';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Additional method to get location with better Indian address formatting
  const getCurrentLocationDetailed = useCallback(async (): Promise<GeolocationResult | null> => {
    setLoading(true);
    setError(null);

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000
        });
      });

      const { latitude, longitude } = position.coords;

      // Use MapTiler for better Indian address formatting
      try {
        const response = await fetch(
          `https://api.maptiler.com/geocoding/${longitude},${latitude}.json?key=${MAPTILER_API_KEY}&language=en`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            let formattedAddress = feature.place_name;
            
            // Extract useful address components for Indian locations
            const context = feature.context || [];
            const addressParts = [];
            
            // Add locality/area if available
            const locality = context.find((c: any) => c.id.startsWith('locality'));
            if (locality) addressParts.push(locality.text);
            
            // Add city
            const place = context.find((c: any) => c.id.startsWith('place'));
            if (place) addressParts.push(place.text);
            
            // Add district/region
            const region = context.find((c: any) => c.id.startsWith('region'));
            if (region) addressParts.push(region.text);
            
            // Add country
            const country = context.find((c: any) => c.id.startsWith('country'));
            if (country) addressParts.push(country.text);
            
            if (addressParts.length > 0) {
              formattedAddress = addressParts.join(', ');
            }

            return {
              latitude,
              longitude,
              address: formattedAddress
            };
          }
        }
      } catch (maptilerError) {
        console.warn('MapTiler detailed geocoding failed:', maptilerError);
      }

      // Fallback to standard method
      return getCurrentLocation();

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get location';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getCurrentLocation]);

  return { 
    getCurrentLocation, 
    getCurrentLocationDetailed,
    loading, 
    error 
  };
};