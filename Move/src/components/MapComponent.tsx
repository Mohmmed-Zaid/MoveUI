import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, AttributionControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Route } from '../types';
import { useTheme } from '../contexts/ThemeContext';

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

interface MapUpdaterProps {
  route: Route | null;
}

const MapUpdater: React.FC<MapUpdaterProps> = ({ route }) => {
  const map = useMap();

  useEffect(() => {
    if (route) {
      const group = new L.FeatureGroup([
        L.marker([route.from.lat, route.from.lng]),
        L.marker([route.to.lat, route.to.lng])
      ]);
      map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
  }, [route, map]);

  return null;
};

interface MapComponentProps {
  route: Route | null;
  className?: string;
}

const MapComponent: React.FC<MapComponentProps> = ({ route, className = '' }) => {
  const mapRef = useRef<L.Map>(null);
  const { isDark } = useTheme();

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

  // MapTiler tile layer URLs
  const getTileLayerUrl = () => {
    if (isDark) {
      return `https://api.maptiler.com/maps/streets-v2-dark/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`;
    }
    return `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`;
  };

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        ref={mapRef}
        center={[18.5204, 73.8567]} // Default to Pune, India
        zoom={12}
        className={`w-full h-full rounded-xl shadow-lg ${
          isDark ? 'brightness-90 contrast-110' : ''
        }`}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url={getTileLayerUrl()}
          attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={20}
          tileSize={256}
        />
        
        <AttributionControl 
          position="bottomright" 
          prefix={false}
        />
        
        {route && (
          <>
            {/* Start Marker */}
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

            {/* End Marker */}
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

            {/* Route Polyline */}
            <Polyline
              positions={route.coordinates}
              pathOptions={{
                color: isDark ? '#60A5FA' : '#3B82F6',
                weight: 4,
                opacity: isDark ? 0.9 : 0.8,
                dashArray: '0'
              }}
            />

            <MapUpdater route={route} />
          </>
        )}
      </MapContainer>

      {/* Route Information Overlay */}
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
          
          {/* Custom Attribution */}
          <div className={`mt-3 pt-2 border-t text-xs ${
            isDark ? 'border-slate-600/50 text-slate-500' : 'border-slate-200/50 text-slate-400'
          }`}>
            Powered by <span className="font-medium text-blue-500">MapTiler</span>
          </div>
        </div>
      )}
      
      {/* Bottom Attribution */}
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