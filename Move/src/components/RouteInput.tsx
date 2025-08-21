import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Navigation, Search, Sparkles, Loader2 } from 'lucide-react';
import { geocodeService } from '../services/api';
import { GeocodeResult } from '../types';
import { useGeolocation } from '../hooks/useGeolocation';
import { useTheme } from '../contexts/ThemeContext';

interface RouteInputProps {
  from: string;
  to: string;
  onFromChange: (value: string, coordinates?: { lat: number; lng: number }) => void;
  onToChange: (value: string, coordinates?: { lat: number; lng: number }) => void;
  onFindRoute: () => void;
  loading: boolean;
}

const RouteInput: React.FC<RouteInputProps> = ({
  from,
  to,
  onFromChange,
  onToChange,
  onFindRoute,
  loading
}) => {
  const [fromSuggestions, setFromSuggestions] = useState<GeocodeResult[]>([]);
  const [toSuggestions, setToSuggestions] = useState<GeocodeResult[]>([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState({ from: false, to: false });
  
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const fromSuggestionsRef = useRef<HTMLDivElement>(null);
  const toSuggestionsRef = useRef<HTMLDivElement>(null);
  
  const { getCurrentLocationDetailed, loading: geoLoading } = useGeolocation();
  const { isDark } = useTheme();

  // Handle clicks outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromSuggestionsRef.current && !fromSuggestionsRef.current.contains(event.target as Node) &&
          !fromInputRef.current?.contains(event.target as Node)) {
        setShowFromSuggestions(false);
      }
      if (toSuggestionsRef.current && !toSuggestionsRef.current.contains(event.target as Node) &&
          !toInputRef.current?.contains(event.target as Node)) {
        setShowToSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchPlaces = async (query: string, type: 'from' | 'to') => {
    if (query.length < 2) {
      if (type === 'from') {
        setFromSuggestions([]);
        setShowFromSuggestions(false);
      } else {
        setToSuggestions([]);
        setShowToSuggestions(false);
      }
      return;
    }

    setSearchLoading(prev => ({ ...prev, [type]: true }));

    try {
      const results = await geocodeService.search(query);
      
      if (type === 'from') {
        setFromSuggestions(results);
        setShowFromSuggestions(results.length > 0);
      } else {
        setToSuggestions(results);
        setShowToSuggestions(results.length > 0);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearchLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  // Debounce search function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (from.length >= 2) {
        searchPlaces(from, 'from');
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [from]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (to.length >= 2) {
        searchPlaces(to, 'to');
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [to]);

  const handleFromChange = (value: string) => {
    onFromChange(value);
  };

  const handleToChange = (value: string) => {
    onToChange(value);
  };

  const selectSuggestion = (suggestion: GeocodeResult, type: 'from' | 'to') => {
    const coordinates = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon)
    };

    if (type === 'from') {
      onFromChange(suggestion.display_name, coordinates);
      setShowFromSuggestions(false);
      setFromSuggestions([]);
    } else {
      onToChange(suggestion.display_name, coordinates);
      setShowToSuggestions(false);
      setToSuggestions([]);
    }
  };

  const handleCurrentLocation = async () => {
    const location = await getCurrentLocationDetailed();
    if (location && location.address) {
      onFromChange(location.address, {
        lat: location.latitude,
        lng: location.longitude
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (from && to && !loading) {
      onFindRoute();
    }
  };

  const handleSwapLocations = () => {
    const tempFrom = from;
    const tempTo = to;
    onFromChange(tempTo);
    onToChange(tempFrom);
  };

  return (
    <div className={`w-full max-w-6xl mx-auto p-4 sm:p-6 backdrop-blur-lg rounded-2xl shadow-xl border relative overflow-hidden ${
      isDark 
        ? 'bg-slate-800/70 border-slate-600/50 shadow-blue-500/10' 
        : 'bg-white/85 border-slate-200/50 shadow-blue-200/20'
    }`}>
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
      
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* From Input */}
          <div className="relative">
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-slate-200' : 'text-slate-700'
            }`}>
              From
            </label>
            <div className="relative">
              <MapPin className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 z-10 ${
                isDark ? 'text-blue-400' : 'text-blue-500'
              }`} />
              <input
                ref={fromInputRef}
                type="text"
                value={from}
                onChange={(e) => handleFromChange(e.target.value)}
                onFocus={() => from.length >= 2 && fromSuggestions.length > 0 && setShowFromSuggestions(true)}
                className={`w-full pl-10 pr-16 py-3 sm:py-4 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 backdrop-blur-sm text-sm sm:text-base ${
                  isDark 
                    ? 'bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 focus:ring-blue-400/50' 
                    : 'bg-white/70 border-slate-200 text-slate-900 placeholder-slate-500 focus:ring-blue-500/50'
                }`}
                placeholder="Enter starting point"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                {searchLoading.from && (
                  <Loader2 className={`w-4 h-4 animate-spin ${
                    isDark ? 'text-blue-400' : 'text-blue-500'
                  }`} />
                )}
                <button
                  type="button"
                  onClick={handleCurrentLocation}
                  disabled={geoLoading}
                  className={`p-1 transition-colors hover:scale-110 ${
                    isDark 
                      ? 'text-blue-400 hover:text-blue-300' 
                      : 'text-blue-500 hover:text-blue-600'
                  }`}
                  title="Use current location"
                >
                  {geoLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Navigation className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* From Suggestions */}
            {showFromSuggestions && fromSuggestions.length > 0 && (
              <div
                ref={fromSuggestionsRef}
                className={`absolute z-50 top-full mt-1 w-full rounded-xl shadow-xl border max-h-60 overflow-y-auto backdrop-blur-lg ${
                  isDark 
                    ? 'bg-slate-800/95 border-slate-600/50' 
                    : 'bg-white/95 border-slate-200'
                }`}
              >
                {fromSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.place_id || index}
                    type="button"
                    onClick={() => selectSuggestion(suggestion, 'from')}
                    className={`w-full px-4 py-3 text-left transition-colors border-b last:border-b-0 flex items-start space-x-3 hover:scale-[1.02] ${
                      isDark 
                        ? 'hover:bg-slate-700/50 border-slate-700/50' 
                        : 'hover:bg-slate-50 border-slate-100'
                    }`}
                  >
                    <MapPin className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      isDark ? 'text-slate-400' : 'text-slate-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm block truncate ${
                        isDark ? 'text-slate-200' : 'text-slate-700'
                      }`}>{suggestion.display_name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* To Input */}
          <div className="relative">
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-slate-200' : 'text-slate-700'
            }`}>
              To
            </label>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 z-10 ${
                isDark ? 'text-cyan-400' : 'text-cyan-500'
              }`} />
              <input
                ref={toInputRef}
                type="text"
                value={to}
                onChange={(e) => handleToChange(e.target.value)}
                onFocus={() => to.length >= 2 && toSuggestions.length > 0 && setShowToSuggestions(true)}
                className={`w-full pl-10 pr-12 py-3 sm:py-4 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 backdrop-blur-sm text-sm sm:text-base ${
                  isDark 
                    ? 'bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400 focus:ring-cyan-400/50' 
                    : 'bg-white/70 border-slate-200 text-slate-900 placeholder-slate-500 focus:ring-cyan-500/50'
                }`}
                placeholder="Enter destination"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {searchLoading.to && (
                  <Loader2 className={`w-4 h-4 animate-spin ${
                    isDark ? 'text-cyan-400' : 'text-cyan-500'
                  }`} />
                )}
              </div>
            </div>

            {/* To Suggestions */}
            {showToSuggestions && toSuggestions.length > 0 && (
              <div
                ref={toSuggestionsRef}
                className={`absolute z-50 top-full mt-1 w-full rounded-xl shadow-xl border max-h-60 overflow-y-auto backdrop-blur-lg ${
                  isDark 
                    ? 'bg-slate-800/95 border-slate-600/50' 
                    : 'bg-white/95 border-slate-200'
                }`}
              >
                {toSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.place_id || index}
                    type="button"
                    onClick={() => selectSuggestion(suggestion, 'to')}
                    className={`w-full px-4 py-3 text-left transition-colors border-b last:border-b-0 flex items-start space-x-3 hover:scale-[1.02] ${
                      isDark 
                        ? 'hover:bg-slate-700/50 border-slate-700/50' 
                        : 'hover:bg-slate-50 border-slate-100'
                    }`}
                  >
                    <Search className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      isDark ? 'text-slate-400' : 'text-slate-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm block truncate ${
                        isDark ? 'text-slate-200' : 'text-slate-700'
                      }`}>{suggestion.display_name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Swap Button - Mobile Friendly */}
        <div className="flex justify-center lg:hidden">
          <button
            type="button"
            onClick={handleSwapLocations}
            disabled={!from || !to}
            className={`p-2 rounded-full transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${
              isDark 
                ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50' 
                : 'bg-white/50 text-slate-600 hover:bg-white/80'
            }`}
            title="Swap locations"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* Find Route Button */}
        <div className="flex justify-center pt-2">
          <button
            type="submit"
            disabled={!from || !to || loading}
            className={`w-full sm:w-auto px-8 py-3 sm:py-4 text-white font-semibold rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 relative overflow-hidden min-w-[200px] ${
              isDark 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' 
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm sm:text-base">Finding Route...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span className="text-sm sm:text-base">Show Route</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Location Suggestions for India */}
        <div className={`mt-4 p-3 rounded-lg ${
          isDark ? 'bg-slate-700/30' : 'bg-blue-50/50'
        }`}>
          <h4 className={`text-xs font-medium mb-2 ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Popular Indian Cities
          </h4>
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {['Pune, Maharashtra', 'Mumbai, Maharashtra', 'Delhi', 'Bangalore, Karnataka', 'Hyderabad, Telangana', 'Chennai, Tamil Nadu'].map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => !to ? handleToChange(city) : handleFromChange(city)}
                className={`text-xs px-2 py-1 rounded-full transition-colors ${
                  isDark 
                    ? 'bg-slate-600/50 text-slate-300 hover:bg-slate-600' 
                    : 'bg-white/70 text-slate-600 hover:bg-white'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
};

export default RouteInput;