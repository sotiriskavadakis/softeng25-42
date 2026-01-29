import { Charger, CHARGER_STATUS_LABELS, ChargerStatus } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, MapPin, Star, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChargerCardProps {
  charger: Charger;
  isSelected?: boolean;
  onClick?: () => void;
}

export function ChargerCard({ charger, isSelected, onClick }: ChargerCardProps) {
  const statusVariant: Record<ChargerStatus, "available" | "occupied" | "offline" | "warning" | "destructive"> = {
    available: "available",
    occupied: "occupied",
    reserved: "warning",
    faulted: "destructive",
    offline: "offline",
  };

  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5",
        isSelected && "ring-2 ring-primary shadow-glow"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">{charger.locationName}</h3>
              <Badge variant={statusVariant[charger.status]} className="shrink-0">
                {CHARGER_STATUS_LABELS[charger.status]}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{charger.locationAddress}</span>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-primary" />
                <span className="font-medium">{charger.maxPowerKw} kW</span>
              </div>
              
              <span className="text-muted-foreground">
                €{charger.tariffPerKwh.toFixed(2)}/kWh
              </span>

              <Badge variant="outline" className="text-xs">
                {charger.typeName}
              </Badge>

              {charger.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                  <span>{charger.rating}</span>
                </div>
              )}
            </div>
          </div>

          {charger.distance && (
            <div className="flex flex-col items-end shrink-0">
              <div className="flex items-center gap-1 text-sm font-medium text-primary">
                <Navigation className="h-3.5 w-3.5" />
                <span>{charger.distance} km</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
