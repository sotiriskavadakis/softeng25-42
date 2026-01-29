import { useState, useMemo, useCallback } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { Button } from "@/components/ui/button";
import { SearchFilters, FilterState } from "@/components/map/SearchFilters";
import { GoogleMapComponent } from "@/components/map/GoogleMap";
import { LocationPopup } from "@/components/map/LocationPopup";
import { HealthCheckWidget } from "@/components/map/HealthCheckWidget";
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
import { Loader2, SearchX, RotateCcw, MapPin, WifiOff, RefreshCw } from "lucide-react";

export default function MapPage() {
  const navigate = useNavigate();
  const [mapBounds, setMapBounds] = useState<BoundingBox | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationWithChargers | null>(null);
  const [selectedCharger, setSelectedCharger] = useState<ChargerInfo | null>(null);
  const [showChargingOverlay, setShowChargingOverlay] = useState(false);
  const [filters, setFilters] = useState<FilterState | null>(null);

  // Charging session management
  const chargingSession = useChargingSession({
    onSessionEnded: () => {
      setShowChargingOverlay(false);
      navigate("/sessions");
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

      // Filter by available after time - chargers that will be available after the specified time
      // This is a placeholder filter - the actual availability check would need reservation data
      // For now, we show all chargers when this filter is set
      // In a full implementation, this would check against reservation end times

      return true;
    });
  }, [locations, filters]);

  const handleSearch = (newFilters: FilterState) => {
    setFilters(newFilters);
    
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

  // Calculate total stats
  const totalAvailable = useMemo(() => 
    filteredLocations.reduce((sum, loc) => sum + loc.availableChargers, 0),
    [filteredLocations]
  );

  // Show initial loading only before we have bounds
  const showInitialLoading = !mapBounds && isLoading;

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <main className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Quick stats bar */}
          <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span><strong className="text-foreground">{filteredLocations.length}</strong> locations in view</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span><strong className="text-foreground">{totalAvailable}</strong> chargers available</span>
            </div>
            {isFetching && !isLoading && (
              <div className="flex items-center gap-1 text-primary">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs">Updating...</span>
              </div>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Map Area */}
            <div className="flex-1 relative">
              <div className="rounded-xl overflow-hidden border border-border shadow-sm h-[500px] lg:h-[600px]">
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
                ) : filteredLocations.length === 0 && filters && !isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full bg-muted/50 gap-4 p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <SearchX className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">No locations found</h3>
                      <p className="text-muted-foreground text-sm mt-1">
                        No charging stations match your filters in this area.
                      </p>
                    </div>
                    <Button variant="outline" onClick={handleClearFilters} className="gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <GoogleMapComponent 
                    locations={filteredLocations} 
                    onLocationClick={handleLocationClick}
                    selectedLocationId={selectedLocation?.locationId}
                    onBoundsChange={handleBoundsChange}
                    isLoading={isFetching && !locations.length}
                  />
                )}
              </div>

              {/* Location Popup - appears over the map */}
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
            </div>

            {/* Search Filters Sidebar */}
            <div className="w-full lg:w-80 shrink-0 space-y-4">
              <HealthCheckWidget />
              <SearchFilters onSearch={handleSearch} onClear={handleClearFilters} />
            </div>
          </div>
        </div>
      </main>

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
