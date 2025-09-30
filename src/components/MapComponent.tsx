import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Route } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { Navigation, MapPin, Square, Play } from 'lucide-react';

// MapTiler API Key
const MAPTILER_API_KEY = 'Fh0gANs6ihPBqlLpsjIm';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const liveLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapUpdaterProps {
  route: Route | null;
  currentLocation: { lat: number; lng: number } | null;
}

const MapUpdater: React.FC<MapUpdaterProps> = ({ route, currentLocation }) => {
  const map = useMap();
  const routeIdRef = useRef<string | null>(null);
  const hasSetBoundsRef = useRef(false);

  useEffect(() => {
    // Only update map view when we have a new route
    if (route && route.id !== routeIdRef.current) {
      routeIdRef.current = route.id;
      hasSetBoundsRef.current = false;
      
      // Small delay to ensure route is rendered
      setTimeout(() => {
        if (!hasSetBoundsRef.current) {
          const group = new L.FeatureGroup([
            L.marker([route.from.lat, route.from.lng]),
            L.marker([route.to.lat, route.to.lng])
          ]);
          
          map.fitBounds(group.getBounds(), { 
            padding: [50, 50],
            maxZoom: 15
          });
          
          hasSetBoundsRef.current = true;
        }
      }, 100);
    } else if (!route) {
      // Reset when route is cleared
      routeIdRef.current = null;
      hasSetBoundsRef.current = false;
      
      // Center on current location if available
      if (currentLocation) {
        map.setView([currentLocation.lat, currentLocation.lng], 16);
      }
    }
  }, [route?.id, map, currentLocation, route]);

  return null;
};

interface MapComponentProps {
  route: Route | null;
  className?: string;
}

const MapComponent: React.FC<MapComponentProps> = ({ route, className = '' }) => {
  const mapRef = useRef<L.Map>(null);
  const { isDark } = useTheme();
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number; address?: string; accuracy?: number } | null>(null);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${Math.round(distance)} m`;
    }
    return `${(distance / 1000).toFixed(1)} km`;
  };

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getTileLayerUrl = () => {
    if (isDark) {
      return `https://api.maptiler.com/maps/streets-v2-dark/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`;
    }
    return `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`;
  };

  // Reverse geocode function
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${MAPTILER_API_KEY}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          return data.features[0].place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
      }
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
    }
    
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  // Get current location once
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const address = await reverseGeocode(latitude, longitude);
        
        const locationData = {
          lat: latitude,
          lng: longitude,
          address,
          accuracy
        };
        
        setCurrentLocation(locationData);
        setIsGettingLocation(false);
        
        // Only center map on location if there's no active route
        if (mapRef.current && !route) {
          mapRef.current.setView([latitude, longitude], 16);
        }

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('currentLocationFound', {
          detail: { latitude, longitude, address }
        }));
      },
      (error) => {
        setIsGettingLocation(false);
        setLocationError(error.message);
        console.error('Error getting location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Start live tracking
  const handleStartLiveTracking = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    if (isLiveTracking) {
      return;
    }

    setLocationError(null);
    setIsLiveTracking(true);

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const address = await reverseGeocode(latitude, longitude);
        
        const locationData = {
          lat: latitude,
          lng: longitude,
          address,
          accuracy
        };
        
        setCurrentLocation(locationData);

        window.dispatchEvent(new CustomEvent('liveLocationUpdate', {
          detail: { latitude, longitude, address, accuracy }
        }));
      },
      (error) => {
        setLocationError(error.message);
        console.error('Error watching location:', error);
        handleStopLiveTracking();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    setWatchId(id);
    window.dispatchEvent(new CustomEvent('liveTrackingStarted'));
  };

  // Stop live tracking
  const handleStopLiveTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    
    setIsLiveTracking(false);
    window.dispatchEvent(new CustomEvent('liveTrackingStopped'));
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        ref={mapRef}
        center={[18.5204, 73.8567]}
        zoom={12}
        className={`w-full h-full rounded-xl shadow-lg ${
          isDark ? 'brightness-90 contrast-110' : ''
        }`}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url={getTileLayerUrl()}
          attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a>'
          maxZoom={20}
          tileSize={256}
        />
        
        {/* Current Location Marker with Accuracy Circle */}
        {currentLocation && (
          <>
            <Marker position={[currentLocation.lat, currentLocation.lng]} icon={liveLocationIcon}>
              <Popup>
                <div className={`p-2 ${isDark ? 'bg-slate-800 text-white' : ''}`}>
                  <h3 className="font-semibold text-blue-700 mb-1 flex items-center">
                    <Navigation className="w-4 h-4 mr-1" />
                    Your Location
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                    {currentLocation.address}
                  </p>
                  {isLiveTracking && (
                    <div className={`text-xs mt-1 flex items-center ${
                      isDark ? 'text-green-400' : 'text-green-600'
                    }`}>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                      Live tracking active
                    </div>
                  )}
                  {currentLocation.accuracy && (
                    <div className={`text-xs mt-1 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Accuracy: ±{Math.round(currentLocation.accuracy)}m
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
            
            {currentLocation.accuracy && (
              <Circle
                center={[currentLocation.lat, currentLocation.lng]}
                radius={currentLocation.accuracy}
                pathOptions={{
                  color: isDark ? '#60A5FA' : '#3B82F6',
                  fillColor: isDark ? '#60A5FA' : '#3B82F6',
                  fillOpacity: 0.1,
                  weight: 2,
                  opacity: 0.5,
                }}
              />
            )}
          </>
        )}
        
        {route && (
          <>
            <Marker position={[route.from.lat, route.from.lng]} icon={startIcon}>
              <Popup>
                <div className={`p-2 ${isDark ? 'bg-slate-800 text-white' : ''}`}>
                  <h3 className="font-semibold text-green-700 mb-1">Start</h3>
                  <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                    {route.from.address}
                  </p>
                </div>
              </Popup>
            </Marker>

            <Marker position={[route.to.lat, route.to.lng]} icon={endIcon}>
              <Popup>
                <div className={`p-2 ${isDark ? 'bg-slate-800 text-white' : ''}`}>
                  <h3 className="font-semibold text-red-700 mb-1">Destination</h3>
                  <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                    {route.to.address}
                  </p>
                </div>
              </Popup>
            </Marker>

            <Polyline
              positions={route.coordinates}
              pathOptions={{
                color: isDark ? '#60A5FA' : '#3B82F6',
                weight: 4,
                opacity: isDark ? 0.9 : 0.8,
              }}
            />

            <MapUpdater route={route} currentLocation={currentLocation} />
          </>
        )}

        {!route && currentLocation && (
          <MapUpdater route={null} currentLocation={currentLocation} />
        )}
      </MapContainer>

      {/* Floating Location Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col space-y-2">
        <button
          onClick={handleGetCurrentLocation}
          disabled={isGettingLocation || isLiveTracking}
          className={`group relative p-3 backdrop-blur-lg rounded-full shadow-lg border transition-all duration-200 hover:scale-110 ${
            isGettingLocation
              ? isDark
                ? 'bg-slate-700/50 border-slate-600/50'
                : 'bg-slate-200/50 border-slate-300/50'
              : isDark 
                ? 'bg-slate-800/90 border-slate-600/50 hover:bg-slate-700/90' 
                : 'bg-white/90 border-slate-200/50 hover:bg-slate-50'
          } ${(isGettingLocation || isLiveTracking) ? 'cursor-not-allowed opacity-50' : ''}`}
          title="Get current location"
        >
          {isGettingLocation ? (
            <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <MapPin className={`w-5 h-5 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`} />
          )}
          <div className={`absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity ${
            isDark ? 'bg-slate-700 text-slate-200' : 'bg-white text-slate-700'
          }`}>
            Current Location
          </div>
        </button>

        {!isLiveTracking ? (
          <button
            onClick={handleStartLiveTracking}
            disabled={isGettingLocation}
            className={`group relative p-3 backdrop-blur-lg rounded-full shadow-lg border transition-all duration-200 hover:scale-110 ${
              isDark 
                ? 'bg-green-600/20 border-green-500/50 hover:bg-green-600/30' 
                : 'bg-green-50/90 border-green-300/50 hover:bg-green-100'
            } ${isGettingLocation ? 'cursor-not-allowed opacity-50' : ''}`}
            title="Start live tracking"
          >
            <Play className={`w-5 h-5 ${
              isDark ? 'text-green-400' : 'text-green-600'
            }`} />
            <div className={`absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity ${
              isDark ? 'bg-slate-700 text-slate-200' : 'bg-white text-slate-700'
            }`}>
              Start Live Tracking
            </div>
          </button>
        ) : (
          <button
            onClick={handleStopLiveTracking}
            className={`group relative p-3 backdrop-blur-lg rounded-full shadow-lg border transition-all duration-200 hover:scale-110 ${
              isDark 
                ? 'bg-red-600/20 border-red-500/50 hover:bg-red-600/30' 
                : 'bg-red-50/90 border-red-300/50 hover:bg-red-100'
            }`}
            title="Stop live tracking"
          >
            <Square className={`w-5 h-5 ${
              isDark ? 'text-red-400' : 'text-red-600'
            }`} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
            <div className={`absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity ${
              isDark ? 'bg-slate-700 text-slate-200' : 'bg-white text-slate-700'
            }`}>
              Stop Live Tracking
            </div>
          </button>
        )}
      </div>

      {locationError && (
        <div className={`absolute bottom-20 left-4 right-4 z-10 p-3 backdrop-blur-lg rounded-lg shadow-lg border ${
          isDark 
            ? 'bg-red-500/20 border-red-400/30 text-red-300' 
            : 'bg-red-50/90 border-red-200/50 text-red-700'
        }`}>
          <p className="text-sm font-medium">{locationError}</p>
        </div>
      )}

      {route && (
        <div className={`absolute top-4 left-4 z-10 backdrop-blur-sm rounded-lg p-4 shadow-lg border ${
          isDark 
            ? 'bg-slate-800/90 border-slate-600/50' 
            : 'bg-white/90 border-slate-200/50'
        }`}>
          <h3 className={`font-semibold mb-2 ${
            isDark ? 'text-slate-200' : 'text-slate-800'
          }`}>Route Information</h3>
          <div className="space-y-1 text-sm">
            <div className="flex items-center space-x-2">
              <span className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Distance:</span>
              <span className={`font-medium ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`}>{formatDistance(route.distance)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Duration:</span>
              <span className={`font-medium ${
                isDark ? 'text-cyan-400' : 'text-cyan-600'
              }`}>{formatDuration(route.duration)}</span>
            </div>
          </div>
        </div>
      )}

      <div className={`absolute bottom-2 right-2 z-10 text-xs px-2 py-1 rounded backdrop-blur-sm ${
        isDark 
          ? 'bg-slate-800/70 text-slate-400' 
          : 'bg-white/70 text-slate-500'
      }`}>
        Created by <span className="font-medium text-blue-500">4squaredevs</span>
      </div>
    </div>
  );
};

export default MapComponent;
