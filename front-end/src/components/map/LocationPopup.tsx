import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Zap, Star, Navigation, Clock, ChevronRight, DollarSign, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LocationWithChargers, ChargerInfo } from "@/hooks/useChargingPoints";
import { usePointDetails, getPointDetailsErrorMessage } from "@/hooks/usePointDetails";
import { useReservation } from "@/hooks/useReservation";
import { cn } from "@/lib/utils";
import { CHARGER_STATUS_LABELS } from "@/types";
import { format } from "date-fns";
import { ReservationTimePicker } from "@/components/chargers/ReservationTimePicker";

interface LocationPopupProps {
  location: LocationWithChargers;
  onClose: () => void;
  onNavigate: () => void;
  onSelectCharger: (charger: ChargerInfo) => void;
}

const statusColors: Record<string, string> = {
  available: "bg-success text-success-foreground",
  occupied: "bg-primary text-primary-foreground",
  reserved: "bg-warning text-warning-foreground",
  offline: "bg-muted text-muted-foreground",
  faulted: "bg-destructive text-destructive-foreground",
};

export function LocationPopup({ location, onClose, onNavigate, onSelectCharger }: LocationPopupProps) {
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Fetch point details when a charger is selected
  const { data: pointDetails, isLoading: isLoadingDetails, error: detailsError } = usePointDetails(selectedPointId);
  
  // Reservation mutation
  const reservation = useReservation({
    onSuccess: (result) => {
      if (result.success) {
        // Refresh point details after reservation
        setSelectedPointId(null);
        setTimeout(() => setSelectedPointId(result.pointId), 100);
      }
    }
  });

  // Group chargers by type
  const chargersByType = location.chargers.reduce((acc, charger) => {
    const type = charger.typeName;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(charger);
    return acc;
  }, {} as Record<string, ChargerInfo[]>);

  const handleChargerClick = (charger: ChargerInfo) => {
    // Set selected point to fetch details from API
    setSelectedPointId(charger.chargerId);
  };

  const handleReserveClick = () => {
    setShowTimePicker(true);
  };

  const handleReserveConfirm = (durationMinutes: number) => {
    if (selectedPointId) {
      reservation.mutate({ pointId: selectedPointId, durationMinutes });
      setShowTimePicker(false);
    }
  };

  const handleReserveCancel = () => {
    setShowTimePicker(false);
  };

  const handleStartCharging = () => {
    const charger = location.chargers.find(c => c.chargerId === selectedPointId);
    if (charger) {
      onSelectCharger(charger);
    }
  };

  const handleBack = () => {
    setSelectedPointId(null);
  };

  // Check if reservation is active (in the future) or expired (in the past)
  const now = new Date();
  const hasActiveReservation = pointDetails?.reservationEndTime != null && pointDetails.reservationEndTime > now;
  const canReserve = pointDetails?.status === "AVAILABLE" && !hasActiveReservation;
  const canCharge = pointDetails?.status === "AVAILABLE";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-card rounded-xl shadow-xl border border-border overflow-hidden z-30"
    >
      {/* Header */}
      <div className="relative p-4 pb-3 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <button
          onClick={selectedPointId ? handleBack : onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
        
        <div className="flex items-start gap-3 pr-8">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {selectedPointId ? `Charger #${selectedPointId.slice(-6)}` : location.name}
            </h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{location.address}</span>
            </div>
          </div>
        </div>

        {/* Quick stats - only show when not viewing details */}
        {!selectedPointId && (
          <div className="flex items-center gap-4 mt-3">
            {location.score > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 text-warning fill-warning" />
                <span className="font-medium">{location.score.toFixed(1)}</span>
              </div>
            )}
            <Badge variant={location.availableChargers > 0 ? "default" : "secondary"} className="text-xs">
              {location.availableChargers}/{location.totalChargers} available
            </Badge>
            {location.isFastCharger && (
              <Badge variant="outline" className="text-xs gap-1">
                <Zap className="h-3 w-3" />
                Fast
              </Badge>
            )}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {selectedPointId ? (
          /* Point Details View - fetched from /api/pointID */
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-4"
          >
            {isLoadingDetails ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-16 rounded-lg" />
                  <Skeleton className="h-16 rounded-lg" />
                </div>
                <Skeleton className="h-12 w-full" />
              </div>
            ) : detailsError ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                <p className="text-sm text-destructive">
                  {getPointDetailsErrorMessage(detailsError)}
                </p>
                <Button variant="outline" size="sm" className="mt-3" onClick={handleBack}>
                  Go Back
                </Button>
              </div>
            ) : pointDetails ? (
              <div className="space-y-4">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <Badge 
                    variant={pointDetails.status === "AVAILABLE" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {pointDetails.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    ID: {pointDetails.pointId}
                  </span>
                </div>

                {/* Specs Grid - API Fields: cap, kwhprice, is_manual_price, reservationendtime */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Zap className="h-3.5 w-3.5" />
                      <span className="text-xs">Power (cap)</span>
                    </div>
                    <p className="font-semibold text-primary">{pointDetails.capacity} kW</p>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      <span className="text-xs">
                        Price {pointDetails.isManualPrice && "(manual)"}
                      </span>
                    </div>
                    <p className="font-semibold">
                      {pointDetails.kwhPrice != null ? `€${pointDetails.kwhPrice.toFixed(2)}/kWh` : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Reservation Status - only show if there's an active future reservation */}
                {hasActiveReservation && (
                  <div className="bg-warning/10 rounded-lg p-3 border border-warning/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-warning">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Reserved Until</span>
                      </div>
                      <p className="font-semibold text-sm text-warning">
                        {format(pointDetails.reservationEndTime!, "HH:mm, MMM d")}
                      </p>
                    </div>
                  </div>
                )}

                {/* Coordinates */}
                <div className="text-xs text-muted-foreground text-center font-mono">
                  {pointDetails.latitude.toFixed(6)}, {pointDetails.longitude.toFixed(6)}
                </div>
              </div>
            ) : null}
          </motion.div>
        ) : (
          /* Chargers List View */
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="p-4 max-h-[300px] overflow-y-auto"
          >
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Select a Charger for Details
            </div>

            {Object.entries(chargersByType).length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No charger data available</p>
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(chargersByType).map(([type, chargers]) => {
                  const availableCount = chargers.filter(c => c.status === "available").length;
                  const maxPower = Math.max(...chargers.map(c => c.maxPowerKw));
                  
                  return (
                    <div key={type} className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{type}</span>
                          <span className="text-xs text-muted-foreground">
                            {maxPower} kW max
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {availableCount}/{chargers.length}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5">
                        {chargers.map((charger) => (
                          <button
                            key={charger.chargerId}
                            onClick={() => handleChargerClick(charger)}
                            className={cn(
                              "px-2 py-1 rounded text-xs font-medium transition-all flex items-center gap-1",
                              charger.status === "available" 
                                ? "bg-success/20 text-success hover:bg-success/30 cursor-pointer" 
                                : "bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer"
                            )}
                          >
                            #{charger.chargerId.toString().slice(-4)}
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions / Time Picker */}
      <div className="p-4 pt-3 border-t border-border bg-muted/30">
        <AnimatePresence mode="wait">
          {showTimePicker && selectedPointId ? (
            <motion.div
              key="time-picker"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ReservationTimePicker
                onConfirm={handleReserveConfirm}
                onCancel={handleReserveCancel}
                isLoading={reservation.isPending}
              />
            </motion.div>
          ) : (
            <motion.div
              key="actions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex gap-2"
            >
              {selectedPointId && pointDetails ? (
                <>
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2" 
                    onClick={handleReserveClick}
                    disabled={!canReserve || reservation.isPending}
                  >
                    <Clock className="h-4 w-4" />
                    {reservation.isPending ? "Reserving..." : "Reserve"}
                  </Button>
                  <Button 
                    className="flex-1 gap-2" 
                    onClick={handleStartCharging}
                    disabled={!canCharge}
                  >
                    <Zap className="h-4 w-4" />
                    Start Charging
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="flex-1 gap-2" onClick={onNavigate}>
                    <Navigation className="h-4 w-4" />
                    Navigate
                  </Button>
                  <Button 
                    className="flex-1 gap-2" 
                    disabled={location.availableChargers === 0}
                    onClick={() => {
                      // Select first available charger
                      const available = location.chargers.find(c => c.status === "available");
                      if (available) handleChargerClick(available);
                    }}
                  >
                    <Zap className="h-4 w-4" />
                    View Details
                  </Button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
