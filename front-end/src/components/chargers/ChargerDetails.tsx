import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Zap, 
  MapPin, 
  Navigation, 
  Clock, 
  DollarSign,
  Calendar,
  Play,
  X,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { usePointDetails, getPointDetailsErrorMessage } from "@/hooks/usePointDetails";
import { useReservation } from "@/hooks/useReservation";
import { PointStatus } from "@/lib/api/points";
import { format } from "date-fns";

interface ChargerDetailsProps {
  pointId: string;
  providerName?: string;
  onClose: () => void;
  onStartCharging: () => void;
  onNavigate: (lat: number, lon: number) => void;
}

const STATUS_LABELS: Record<PointStatus, string> = {
  AVAILABLE: "Available",
  OFFLINE: "Offline",
  BUSY: "In Use",
  ONLINE: "Online",
};

const STATUS_VARIANTS: Record<PointStatus, "available" | "occupied" | "offline" | "warning" | "destructive"> = {
  AVAILABLE: "available",
  OFFLINE: "offline",
  BUSY: "occupied",
  ONLINE: "available",
};

export function ChargerDetails({ 
  pointId,
  providerName,
  onClose, 
  onStartCharging, 
  onNavigate 
}: ChargerDetailsProps) {
  const { data: details, isLoading, error } = usePointDetails(pointId);
  const reservation = useReservation();

  const canStartCharging = details?.status === "AVAILABLE";
  const canReserve = details?.status === "AVAILABLE";
  const hasReservation = details?.reservationEndTime != null;

  const handleReserve = () => {
    reservation.mutate({ pointId });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">
                {providerName || "Charging Point"}
              </CardTitle>
              {details && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{details.latitude.toFixed(5)}, {details.longitude.toFixed(5)}</span>
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {isLoading ? (
            <Skeleton className="h-6 w-24 mt-2" />
          ) : details ? (
            <Badge variant={STATUS_VARIANTS[details.status]} className="w-fit mt-2">
              {STATUS_LABELS[details.status]}
            </Badge>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
              </div>
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <AlertCircle className="h-10 w-10 text-destructive mb-3" />
              <p className="text-sm text-destructive font-medium">
                {getPointDetailsErrorMessage(error)}
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : details ? (
            <>
              {/* Specs Grid - API Fields */}
              <div className="grid grid-cols-2 gap-3">
                {/* Point ID */}
                <div className="bg-secondary/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <Zap className="h-3.5 w-3.5" />
                    Point ID
                  </div>
                  <p className="text-sm font-bold truncate" title={details.pointId}>
                    {details.pointId}
                  </p>
                </div>
                
                {/* Capacity (cap) */}
                <div className="bg-secondary/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <Zap className="h-3.5 w-3.5" />
                    Power
                  </div>
                  <p className="text-lg font-bold text-primary">{details.capacity} kW</p>
                </div>

                {/* Price (kwhprice) */}
                <div className="bg-secondary/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    Price {details.isManualPrice && "(Manual)"}
                  </div>
                  <p className="text-lg font-bold">
                    {details.kwhPrice != null ? `€${details.kwhPrice.toFixed(2)}/kWh` : "N/A"}
                  </p>
                </div>

                {/* Reservation End Time */}
                <div className="bg-secondary/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                    <Clock className="h-3.5 w-3.5" />
                    Reserved Until
                  </div>
                  <p className="text-sm font-bold">
                    {hasReservation 
                      ? format(details.reservationEndTime!, "HH:mm, MMM d")
                      : "Not reserved"}
                  </p>
                </div>
              </div>

              {/* Coordinates */}
              <div className="bg-secondary/30 rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <MapPin className="h-3.5 w-3.5" />
                  Coordinates
                </div>
                <p className="font-mono text-xs">
                  {details.latitude.toFixed(6)}, {details.longitude.toFixed(6)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button 
                  className="w-full" 
                  size="lg"
                  disabled={!canStartCharging}
                  onClick={onStartCharging}
                >
                  <Play className="h-4 w-4" />
                  Start Charging
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleReserve}
                    disabled={!canReserve || hasReservation || reservation.isPending}
                  >
                    <Calendar className="h-4 w-4" />
                    {reservation.isPending ? "..." : "Reserve"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => onNavigate(details.latitude, details.longitude)}
                  >
                    <Navigation className="h-4 w-4" />
                    Navigate
                  </Button>
                </div>
              </div>

              {/* Status-specific messages */}
              {hasReservation && (
                <p className="text-sm text-warning text-center">
                  Reserved until {format(details.reservationEndTime!, "HH:mm")}
                </p>
              )}
              {details.status === "OFFLINE" && (
                <p className="text-sm text-destructive text-center">
                  This charger is currently offline
                </p>
              )}
              {details.status === "BUSY" && (
                <p className="text-sm text-muted-foreground text-center">
                  This charger is currently in use
                </p>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}
