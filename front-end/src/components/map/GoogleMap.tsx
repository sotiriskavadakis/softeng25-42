import { useCallback, useState, useMemo, useEffect, useRef } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Libraries } from "@react-google-maps/api";
import { LocationWithChargers } from "@/hooks/useChargingPoints";
import { BoundingBox } from "@/lib/api/points";
import { Zap, ZoomIn, ZoomOut, Loader2, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { LocationSearch } from "./LocationSearch";
import { SystemStatusBadge } from "./SystemStatusBadge";
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyCIQx4cPi6G5WvP4fypr5GP8wELU71uYT0";

// Libraries to load - must be a constant to prevent reload loops
const libraries: Libraries = ["places"];

interface GoogleMapComponentProps {
  locations: LocationWithChargers[];
  onLocationClick?: (location: LocationWithChargers) => void;
  selectedLocationId?: string | null;
  onBoundsChange?: (bounds: BoundingBox) => void;
  isLoading?: boolean;
}

const containerStyle = {
  width: "100%",
  height: "100%",
};

// Default center on Athens, Greece (fallback)
const defaultCenter = {
  lat: 37.9838,
  lng: 23.7275,
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "water",
      elementType: "geometry.fill",
      stylers: [{ color: "#a3ccff" }],
    },
  ],
};

// Marker colors based on availability
const getMarkerIcon = (location: LocationWithChargers) => {
  let color = "#22c55e"; // green - available
  if (location.underRepair) {
    color = "#f59e0b"; // warning - under repair
  } else if (location.availableChargers === 0) {
    color = "#6b7280"; // gray - all in use
  }

  return {
    path: "M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z",
    fillColor: color,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale: 1.2,
    anchor: new google.maps.Point(12, 32),
    labelOrigin: new google.maps.Point(12, 12),
  };
};

export function GoogleMapComponent({
  locations,
  onLocationClick,
  selectedLocationId,
  onBoundsChange,
  isLoading,
}: GoogleMapComponentProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [hoveredLocation, setHoveredLocation] = useState<LocationWithChargers | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationRequested, setLocationRequested] = useState(false);
  const boundsDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const hasCenteredOnUser = useRef(false);

  // Extract bounds from map and notify parent
  const emitBounds = useCallback(() => {
    if (!map || !onBoundsChange) return;

    const bounds = map.getBounds();
    if (!bounds) return;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    const boundingBox: BoundingBox = {
      min_lat: sw.lat(),
      max_lat: ne.lat(),
      min_lon: sw.lng(),
      max_lon: ne.lng(),
    };

    onBoundsChange(boundingBox);
  }, [map, onBoundsChange]);

  // Debounced bounds update - fast debounce for responsive feel
  const handleBoundsChanged = useCallback(() => {
    if (boundsDebounceRef.current) {
      clearTimeout(boundsDebounceRef.current);
    }

    boundsDebounceRef.current = setTimeout(() => {
      emitBounds();
    }, 150); // 150ms debounce - near-instant response
  }, [emitBounds]);

  // Fallback to IP-based geolocation
  const fetchIPLocation = useCallback(async () => {
    try {
      console.log("[GoogleMap] Trying IP-based geolocation...");
      const response = await fetch("https://ipapi.co/json/");
      const data = await response.json();
      if (data.latitude && data.longitude) {
        const userPos = { lat: data.latitude, lng: data.longitude };
        console.log("[GoogleMap] IP location found:", userPos);
        return userPos;
      }
    } catch (e) {
      console.log("[GoogleMap] IP geolocation failed:", e);
    }
    return null;
  }, []);

  // Request user location on mount
  useEffect(() => {
    if (locationRequested) return;
    setLocationRequested(true);

    const getLocation = async () => {
      if (!("geolocation" in navigator)) {
        console.log("[GoogleMap] Geolocation not supported, trying IP fallback");
        const ipLoc = await fetchIPLocation();
        if (ipLoc) setUserLocation(ipLoc);
        return;
      }

      console.log("[GoogleMap] Requesting geolocation...");
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log("[GoogleMap] Got user location:", userPos);
          setUserLocation(userPos);
        },
        async (error) => {
          console.log("[GoogleMap] Geolocation error code:", error.code, "message:", error.message);
          
          // Fallback to IP geolocation
          const ipLoc = await fetchIPLocation();
          if (ipLoc) {
            setUserLocation(ipLoc);
          } else if (error.code === 1) {
            toast({
              title: "Location access denied",
              description: "Enable location in your browser to center the map on you",
              variant: "destructive",
            });
          }
        },
        {
          enableHighAccuracy: false,
          timeout: 5000, // Faster timeout to fallback quicker
          maximumAge: 300000,
        }
      );
    };

    getLocation();
  }, [locationRequested, fetchIPLocation]);

  // Center map when user location is obtained
  useEffect(() => {
    console.log("[GoogleMap] Center effect - userLocation:", userLocation, "map:", !!map, "hasCentered:", hasCenteredOnUser.current);
    
    if (userLocation && map && !hasCenteredOnUser.current) {
      console.log("[GoogleMap] Centering map on user location");
      hasCenteredOnUser.current = true;
      map.setCenter(userLocation);
      map.setZoom(14);
      toast({
        title: "Location found",
        description: "Map centered on your location",
      });
    }
  }, [userLocation, map]);

  // Initial center/zoom - use default, map will pan when location is ready
  const initialCenter = defaultCenter;
  const initialZoom = 12;

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    
    // If we already have user location, center on it
    if (userLocation) {
      mapInstance.setCenter(userLocation);
      mapInstance.setZoom(14);
    }

    // Emit initial bounds after a short delay to ensure map is ready
    setTimeout(() => {
      if (onBoundsChange) {
        const bounds = mapInstance.getBounds();
        if (bounds) {
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          onBoundsChange({
            min_lat: sw.lat(),
            max_lat: ne.lat(),
            min_lon: sw.lng(),
            max_lon: ne.lng(),
          });
        }
      }
    }, 100);
  }, [userLocation, onBoundsChange]);

  const onUnmount = useCallback(() => {
    if (boundsDebounceRef.current) {
      clearTimeout(boundsDebounceRef.current);
    }
    setMap(null);
  }, []);

  const handleZoomIn = () => {
    if (map) {
      map.setZoom((map.getZoom() || 11) + 1);
    }
  };

  const handleZoomOut = () => {
    if (map) {
      map.setZoom((map.getZoom() || 11) - 1);
    }
  };

  const handleLocateUser = () => {
    if (!("geolocation" in navigator)) {
      toast({
        title: "Location not available",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Finding your location...",
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(userPos);
        
        if (map) {
          map.setCenter(userPos);
          map.setZoom(14);
        }
        
        toast({
          title: "Location found",
          description: "Map centered on your location",
        });
      },
      (error) => {
        toast({
          title: "Location error",
          description: error.message || "Could not get your location",
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  // Handle location search selection
  const handleSearchLocation = useCallback((location: { lat: number; lng: number; address: string }) => {
    setUserLocation({ lat: location.lat, lng: location.lng });
    if (map) {
      map.setCenter({ lat: location.lat, lng: location.lng });
      map.setZoom(14);
    }
    toast({
      title: "Location set",
      description: location.address,
    });
  }, [map]);

  const selectedLocation = useMemo(() => {
    return locations.find((loc) => loc.locationId === selectedLocationId);
  }, [locations, selectedLocationId]);

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="text-center text-muted-foreground">
          <p>Error loading Google Maps</p>
          <p className="text-sm">{loadError.message}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading map...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={initialCenter}
        zoom={initialZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
        onBoundsChanged={handleBoundsChanged}
        onDragEnd={handleBoundsChanged}
        onZoomChanged={handleBoundsChanged}
      >
        {/* User location marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: "#3b82f6",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
              scale: 8,
            }}
            title="Your location"
          />
        )}

        {locations.map((location) => (
          <Marker
            key={location.locationId}
            position={{ lat: location.latitude, lng: location.longitude }}
            icon={getMarkerIcon(location)}
            label={{
              text: String(location.availableChargers),
              color: "#1f2937",
              fontSize: "10px",
              fontWeight: "bold",
            }}
            onClick={() => onLocationClick?.(location)}
            onMouseOver={() => setHoveredLocation(location)}
            onMouseOut={() => setHoveredLocation(null)}
          />
        ))}

        {hoveredLocation && !selectedLocationId && (
          <InfoWindow
            position={{ lat: hoveredLocation.latitude, lng: hoveredLocation.longitude }}
            options={{ pixelOffset: new google.maps.Size(0, -35) }}
            onCloseClick={() => setHoveredLocation(null)}
          >
            <div className="p-1 min-w-[150px]">
              <h3 className="font-semibold text-sm text-gray-900">{hoveredLocation.name}</h3>
              <p className="text-xs text-gray-600">{hoveredLocation.address}</p>
              <div className="flex items-center gap-1 mt-1">
                <Zap className="h-3 w-3 text-green-600" />
                <span className="text-xs">
                  {hoveredLocation.availableChargers}/{hoveredLocation.totalChargers} available
                </span>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>


      {/* Map controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
        <Button
          variant="secondary"
          size="icon"
          className="h-9 w-9 shadow-md bg-background"
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-9 w-9 shadow-md bg-background"
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-9 w-9 shadow-md bg-background"
          onClick={handleLocateUser}
          title="Find my location"
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      {/* Search bar and stats overlay */}
      <div className="absolute top-4 left-4 right-16 z-20 flex flex-col gap-2 max-w-sm">
        <LocationSearch onLocationSelect={handleSearchLocation} />
        <div className="bg-background/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md border border-border/50 w-fit">
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{locations.length}</span> locations in view
          </div>
        </div>
      </div>

      {/* System Status Badge - bottom left, compact */}
      <SystemStatusBadge className="absolute bottom-4 left-4 z-20" />

      {/* Legend - bottom right */}
      <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md border border-border/50 z-20">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-success" />
            <span className="text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground" />
            <span className="text-muted-foreground">Busy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-warning" />
            <span className="text-muted-foreground">Repair</span>
          </div>
          {userLocation && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-muted-foreground">You</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
