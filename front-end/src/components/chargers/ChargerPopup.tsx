import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Zap, Navigation, Clock, MapPin, BatteryCharging, AlertCircle, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePointDetails, getPointDetailsErrorMessage } from "@/hooks/usePointDetails";
import { useReservation } from "@/hooks/useReservation";
import { PointStatus } from "@/lib/api/points";
import { format } from "date-fns";

interface ChargerPopupProps {
  pointId: string;
  providerName?: string;
  onClose: () => void;
  onNavigate: (lat: number, lon: number) => void;
  onCharge: () => void;
}

const statusStyles: Record<PointStatus, string> = {
  AVAILABLE: "bg-success/10 text-success border-success/20",
  BUSY: "bg-primary/10 text-primary border-primary/20",
  OFFLINE: "bg-muted text-muted-foreground border-border",
  ONLINE: "bg-success/10 text-success border-success/20",
};

const STATUS_LABELS: Record<PointStatus, string> = {
  AVAILABLE: "Available",
  OFFLINE: "Offline",
  BUSY: "In Use",
  ONLINE: "Online",
};

export function ChargerPopup({
  pointId,
  providerName,
  onClose,
  onNavigate,
  onCharge,
}: ChargerPopupProps) {
  const { data: details, isLoading, error } = usePointDetails(pointId);
  const reservation = useReservation();

  const canCharge = details?.status === "AVAILABLE";
  const canReserve = details?.status === "AVAILABLE" && !details?.reservationEndTime;
  const hasReservation = details?.reservationEndTime != null;

  const handleReserve = () => {
    reservation.mutate({ pointId });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute left-4 bottom-4 z-20 md:left-1/2 md:top-1/2 md:bottom-auto md:-translate-x-1/2 md:-translate-y-1/2"
    >
      <Card className="w-[340px] shadow-lg border border-border overflow-hidden">
        <CardContent className="p-0">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-primary/5 to-accent p-4 border-b border-border">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BatteryCharging className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{providerName || "Charging Point"}</h3>
                  {details && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                      <MapPin className="h-3 w-3" />
                      <span>{details.latitude.toFixed(4)}, {details.longitude.toFixed(4)}</span>
                    </div>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 -mr-2 -mt-1">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-24" />
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-16 rounded-lg" />
                  <Skeleton className="h-16 rounded-lg" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                <p className="text-sm text-destructive">
                  {getPointDetailsErrorMessage(error)}
                </p>
              </div>
            ) : details ? (
              <>
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                    statusStyles[details.status]
                  )}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {STATUS_LABELS[details.status]}
                  </span>
                  <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={details.pointId}>
                    ID: {details.pointId.slice(-8)}
                  </span>
                </div>

                {/* Charger Specs Grid - API Fields */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Power (cap) */}
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Zap className="h-3.5 w-3.5" />
                      <span className="text-xs">Power</span>
                    </div>
                    <p className="font-semibold text-primary">{details.capacity} kW</p>
                  </div>
                  
                  {/* Price (kwhprice) */}
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      <span className="text-xs">
                        Price {details.isManualPrice && "(M)"}
                      </span>
                    </div>
                    <p className="font-semibold">
                      {details.kwhPrice != null ? `€${details.kwhPrice.toFixed(2)}` : "N/A"}
                    </p>
                  </div>
                  
                  {/* Reservation End Time */}
                  <div className="bg-muted/50 rounded-lg p-3 col-span-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-xs">Reserved Until</span>
                      </div>
                      <p className="font-semibold text-sm">
                        {hasReservation 
                          ? format(details.reservationEndTime!, "HH:mm, MMM d")
                          : "Not reserved"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-1.5" 
                    onClick={handleReserve}
                    disabled={!canReserve || reservation.isPending}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {reservation.isPending ? "..." : "Reserve"}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-1.5" 
                    onClick={() => details && onNavigate(details.latitude, details.longitude)}
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    Navigate
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 gap-1.5" 
                    onClick={onCharge}
                    disabled={!canCharge}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    Charge
                  </Button>
                </div>

                {/* Status messages */}
                {hasReservation && (
                  <p className="text-xs text-warning text-center">
                    Reserved until {format(details.reservationEndTime!, "HH:mm")}
                  </p>
                )}
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
