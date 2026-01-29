import { useMemo, useState, useCallback } from "react";
import { Zap, ZoomIn, ZoomOut, Locate } from "lucide-react";
import { LocationWithChargers } from "@/hooks/useChargingPoints";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface InteractiveMapProps {
  locations: LocationWithChargers[];
  onLocationClick?: (location: LocationWithChargers) => void;
  selectedLocationId?: string | null;
}

// Greece bounding box for initial view
const GREECE_BOUNDS = {
  minLat: 34.8,
  maxLat: 41.8,
  minLng: 19.4,
  maxLng: 29.7,
};

// Calculate default center (Athens area)
const DEFAULT_CENTER = { lat: 37.9, lng: 23.73 };
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 8;

export function InteractiveMap({ locations, onLocationClick, selectedLocationId }: InteractiveMapProps) {
  const [zoom, setZoom] = useState(2);
  const [center, setCenter] = useState(DEFAULT_CENTER);

  // Calculate visible bounds based on zoom and center
  const bounds = useMemo(() => {
    const latRange = (GREECE_BOUNDS.maxLat - GREECE_BOUNDS.minLat) / zoom;
    const lngRange = (GREECE_BOUNDS.maxLng - GREECE_BOUNDS.minLng) / zoom;
    
    return {
      minLat: center.lat - latRange / 2,
      maxLat: center.lat + latRange / 2,
      minLng: center.lng - lngRange / 2,
      maxLng: center.lng + lngRange / 2,
    };
  }, [zoom, center]);

  // Convert lat/lng to screen position
  const toScreenPosition = useCallback((lat: number, lng: number) => {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
    const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  }, [bounds]);

  // Filter locations within current bounds
  const visibleLocations = useMemo(() => {
    return locations.filter(loc => {
      return loc.latitude >= bounds.minLat && loc.latitude <= bounds.maxLat &&
             loc.longitude >= bounds.minLng && loc.longitude <= bounds.maxLng;
    });
  }, [locations, bounds]);

  // Get status color for location based on charger availability
  const getStatusColor = (location: LocationWithChargers) => {
    if (location.underRepair) return "text-warning";
    if (location.availableChargers === 0) return "text-muted-foreground";
    if (location.availableChargers > 0) return "text-success";
    return "text-primary";
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.5, MAX_ZOOM));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.5, MIN_ZOOM));
  const handleRecenter = () => {
    setCenter(DEFAULT_CENTER);
    setZoom(2);
  };

  // Handle map drag
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      const lngDelta = -dx * (bounds.maxLng - bounds.minLng) / 400;
      const latDelta = dy * (bounds.maxLat - bounds.minLat) / 400;
      
      setCenter(prev => ({
        lat: prev.lat + latDelta,
        lng: prev.lng + lngDelta,
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  // Handle scroll zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  return (
    <div 
      className="relative w-full h-full bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-hidden cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
    >
      {/* Map grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`
        }}
      />

      {/* Decorative sea area */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <radialGradient id="seaGradient" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="100" height="100" fill="url(#seaGradient)" />
      </svg>

      {/* Location markers */}
      {visibleLocations.map((location) => {
        const pos = toScreenPosition(location.latitude, location.longitude);
        const colorClass = getStatusColor(location);
        const isSelected = selectedLocationId === location.locationId;
        
        return (
          <button
            key={location.locationId}
            onClick={(e) => {
              e.stopPropagation();
              onLocationClick?.(location);
            }}
            className={cn(
              "absolute transform -translate-x-1/2 -translate-y-full transition-all duration-200 z-10",
              "hover:scale-125 hover:z-20 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full",
              isSelected && "scale-125 z-30",
              colorClass
            )}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            title={`${location.name} - ${location.availableChargers}/${location.totalChargers} available`}
          >
            <div className={cn(
              "relative drop-shadow-lg transition-transform",
              isSelected && "animate-bounce"
            )}>
              <svg width="32" height="40" viewBox="0 0 24 32" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z" />
              </svg>
              <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-inner">
                <Zap className="h-3 w-3 text-current" />
              </div>
              {/* Availability badge */}
              {location.totalChargers > 0 && (
                <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-background border-2 border-current flex items-center justify-center">
                  <span className="text-[10px] font-bold text-foreground">
                    {location.availableChargers}
                  </span>
                </div>
              )}
            </div>
          </button>
        );
      })}

      {/* Map controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
        <Button
          variant="secondary"
          size="icon"
          className="h-9 w-9 shadow-md"
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-9 w-9 shadow-md"
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-9 w-9 shadow-md"
          onClick={handleRecenter}
        >
          <Locate className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats overlay */}
      <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md border border-border/50 z-20">
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{visibleLocations.length}</span> locations visible
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm px-4 py-3 rounded-lg shadow-md border border-border/50 z-20">
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-success" />
            <span className="text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-muted-foreground" />
            <span className="text-muted-foreground">All in use</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-warning" />
            <span className="text-muted-foreground">Under repair</span>
          </div>
        </div>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-4 left-4 text-[10px] text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded shadow-sm border border-border/50">
        © EMPower Map
      </div>
    </div>
  );
}
