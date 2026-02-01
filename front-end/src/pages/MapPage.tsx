import { useState, useMemo, useCallback } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { SearchFilters, FilterState } from "@/components/map/SearchFilters";
import { GoogleMapComponent } from "@/components/map/GoogleMap";
import { LocationPopup } from "@/components/map/LocationPopup";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChargingSessionOverlay } from "@/components/session";
import { 
  useChargingPoints, 
  LocationWithChargers, 
  ChargerInfo,
  getErrorMessage,
  BoundingBox 
} from "@/hooks/useChargingPoints";
import { useChargingSession } from "@/hooks/useChargingSession";
import { AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Loader2, SearchX, MapPin, WifiOff, RefreshCw, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MapPage() {
  const navigate = useNavigate();
  const [mapBounds, setMapBounds] = useState<BoundingBox | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationWithChargers | null>(null);
  const [selectedCharger, setSelectedCharger] = useState<ChargerInfo | null>(null);
  const [showChargingOverlay, setShowChargingOverlay] = useState(false);
  const [filters, setFilters] = useState<FilterState | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Charging session management
  const chargingSession = useChargingSession({
    onSessionEnded: () => {
      setShowChargingOverlay(false);
      navigate("/profile");
    },
  });

  // Fetch points based on current map bounds
  const { 
    data: locations = [], 
    isLoading, 
    error, 
    isRefetching, 
    refetch,
    isFetching 
  } = useChargingPoints({ 
    bounds: mapBounds || undefined,
    enabled: !!mapBounds 
  });

  const handleBoundsChange = useCallback((bounds: BoundingBox) => {
    setMapBounds(bounds);
  }, []);

  const handleRetry = () => {
    refetch();
    toast({
      title: "Retrying...",
      description: "Attempting to reconnect to the server.",
    });
  };

  // Filter locations based on current filters (client-side filtering)
  const filteredLocations = useMemo(() => {
    if (!filters || !filters.status) return locations;

    return locations.filter((location) => {
      // Filter by status - check if any charger at location matches selected statuses
      if (filters.status && filters.status.length > 0) {
        const locationStatus = location.status || "AVAILABLE";
        if (!filters.status.includes(locationStatus)) return false;
      }

      // Filter by power range - check chargers' power
      if (filters.powerRange && (filters.powerRange[0] > 2 || filters.powerRange[1] < 300)) {
        const hasChargerInRange = location.chargers?.some(charger => 
          charger.maxPowerKw >= filters.powerRange[0] && 
          charger.maxPowerKw <= filters.powerRange[1]
        );
        if (!hasChargerInRange) return false;
      }

      return true;
    });
  }, [locations, filters]);

  const activeFilterCount = useMemo(() => {
    if (!filters) return 0;
    let count = 0;
    if (filters.status.length > 0 && (filters.status.length !== 1 || filters.status[0] !== "AVAILABLE")) count++;
    if (filters.powerRange[0] > 2 || filters.powerRange[1] < 300) count++;
    if (filters.availableWithinMinutes) count++;
    return count;
  }, [filters]);

  const handleSearch = (newFilters: FilterState) => {
    setFilters(newFilters);
    setShowMobileFilters(false);
    
    // Calculate filtered count for toast
    const count = locations.filter((location) => {
      if (newFilters.status.length > 0) {
        const locationStatus = location.status || "AVAILABLE";
        if (!newFilters.status.includes(locationStatus)) return false;
      }
      if (newFilters.powerRange[0] > 2 || newFilters.powerRange[1] < 300) {
        const hasChargerInRange = location.chargers?.some(charger => 
          charger.maxPowerKw >= newFilters.powerRange[0] && 
          charger.maxPowerKw <= newFilters.powerRange[1]
        );
        if (!hasChargerInRange) return false;
      }
      return true;
    }).length;

    if (count === 0) {
      toast({
        title: "No Locations Found",
        description: "Try adjusting your filters to find charging locations.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Filters Applied",
        description: `Found ${count} location${count !== 1 ? 's' : ''} with ${filteredLocations.reduce((sum, l) => sum + l.availableChargers, 0)} available chargers`,
      });
    }
  };

  const handleClearFilters = () => {
    setFilters(null);
    toast({
      title: "Filters Reset",
      description: `Showing all ${locations.length} locations in view`,
    });
  };

  const handleLocationClick = (location: LocationWithChargers) => {
    setSelectedLocation(location);
    setSelectedCharger(null);
  };

  const handleClosePopup = () => {
    setSelectedLocation(null);
    setSelectedCharger(null);
  };

  const handleNavigate = () => {
    if (selectedLocation) {
      // Open Google Maps with directions
      const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedLocation.latitude},${selectedLocation.longitude}`;
      window.open(url, '_blank');
      toast({
        title: "Navigation",
        description: "Opening Google Maps...",
      });
    }
  };

  const handleSelectCharger = (charger: ChargerInfo) => {
    if (!selectedLocation) return;
    
    setSelectedCharger(charger);
    setShowChargingOverlay(true);
    
    // Start actual charging via API - updates point status to OCCUPIED
    chargingSession.start({
      pointId: charger.chargerId,
      chargerName: `${selectedLocation.name} - ${charger.typeName} #${charger.chargerId.toString().slice(-4)}`,
      locationName: selectedLocation.name,
      kwhPrice: 0.35, // Default price, could come from point details
      initialSoc: 45, // Initial battery %, could be user input
    });
  };

  const handleStopCharging = () => {
    // Stop charging via API - updates point status to AVAILABLE and records session
    chargingSession.stop();
  };

  const handleCloseChargingOverlay = () => {
    // Just hide overlay, charging continues in background
    setShowChargingOverlay(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />

      {/* Main content - full height on mobile */}
      <main className="flex-1 flex flex-col lg:block lg:p-6">
        <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col lg:block">
          
          {/* Mobile header bar with stats and filter button */}
          <div className="flex items-center justify-between px-4 py-2.5 lg:py-0 lg:mb-4 border-b lg:border-0 border-border bg-card lg:bg-transparent">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              <span>
                <strong className="text-foreground">{filteredLocations.length}</strong> locations
              </span>
              {isFetching && !isLoading && (
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
              )}
            </div>
            
            {/* Mobile filter button */}
            <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
              <SheetTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="lg:hidden gap-2 h-8"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
                <SheetHeader className="pb-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <SheetTitle>Filter Chargers</SheetTitle>
                    {activeFilterCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-xs h-7">
                        Clear all
                      </Button>
                    )}
                  </div>
                </SheetHeader>
                <div className="py-4 overflow-y-auto max-h-[calc(85vh-8rem)]">
                  <SearchFilters onSearch={handleSearch} onClear={handleClearFilters} isMobile />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row gap-6 lg:gap-6">
            {/* Map Area - full width on mobile, fills remaining height */}
            <div className="flex-1 relative min-h-0">
              <div className="h-full lg:h-[600px] lg:rounded-xl overflow-hidden lg:border lg:border-border lg:shadow-sm">
                {error && !locations.length ? (
                  <div className="flex flex-col items-center justify-center h-full bg-muted/50 gap-4 p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                      <WifiOff className="h-8 w-8 text-destructive" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">Unable to load charging stations</h3>
                      <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                        {getErrorMessage(error)}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleRetry} 
                      className="gap-2"
                      disabled={isRefetching}
                    >
                      {isRefetching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      {isRefetching ? "Retrying..." : "Try Again"}
                    </Button>
                  </div>
                ) : (
                  /* Always show map - empty results just means no markers */
                  <GoogleMapComponent 
                    locations={filteredLocations} 
                    onLocationClick={handleLocationClick}
                    selectedLocationId={selectedLocation?.locationId}
                    onBoundsChange={handleBoundsChange}
                    isLoading={isFetching && !locations.length}
                  />
                )}
                
                {/* Show "no results" overlay on the map when filters yield nothing */}
                {filteredLocations.length === 0 && filters && !isLoading && !error && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md border border-border/50">
                    <div className="flex items-center gap-2 text-sm">
                      <SearchX className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">No stations match filters</span>
                      <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-7 px-2 text-xs">
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Search Filters Sidebar - Desktop only */}
            <div className="hidden lg:block w-80 shrink-0 space-y-4">
              <SearchFilters onSearch={handleSearch} onClear={handleClearFilters} />
            </div>
          </div>
        </div>
        
        {/* Location Popup - appears ABOVE the map on top of content */}
        <AnimatePresence>
          {selectedLocation && !chargingSession.isCharging && (
            <LocationPopup
              location={selectedLocation}
              onClose={handleClosePopup}
              onNavigate={handleNavigate}
              onSelectCharger={handleSelectCharger}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation - mobile only */}
      <BottomNav />

      {/* Charging Session Overlay */}
      <AnimatePresence>
        {showChargingOverlay && chargingSession.isCharging && chargingSession.metrics && (
          <ChargingSessionOverlay
            chargerName={chargingSession.activeSession?.chargerName || "Charger"}
            metrics={chargingSession.metrics}
            onStop={handleStopCharging}
            onClose={handleCloseChargingOverlay}
            isLoading={chargingSession.isStopping}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
