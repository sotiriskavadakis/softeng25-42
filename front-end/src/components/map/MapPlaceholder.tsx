import { Zap } from "lucide-react";
import { Charger } from "@/types";
import { cn } from "@/lib/utils";

interface MapPlaceholderProps {
  onChargerClick?: (charger: Charger) => void;
  chargers?: Charger[];
}

const statusColors: Record<string, string> = {
  available: "text-success",
  charging: "text-primary",
  reserved: "text-warning",
  offline: "text-muted-foreground",
  faulted: "text-destructive",
};

export function MapPlaceholder({ onChargerClick, chargers = [] }: MapPlaceholderProps) {
  // Predefined positions distributed across the map for visual clarity
  const distributedPositions = [
    { x: 15, y: 25 }, { x: 28, y: 38 }, { x: 18, y: 55 },
    { x: 38, y: 28 }, { x: 48, y: 48 }, { x: 42, y: 62 },
    { x: 58, y: 22 }, { x: 62, y: 42 }, { x: 52, y: 58 },
    { x: 72, y: 32 }, { x: 78, y: 52 }, { x: 82, y: 38 },
    { x: 25, y: 72 }, { x: 68, y: 72 }, { x: 35, y: 45 },
    { x: 85, y: 65 }, { x: 12, y: 42 }, { x: 45, y: 75 },
    { x: 75, y: 18 }, { x: 55, y: 35 },
  ];

  // Get a consistent position for each charger based on its ID
  const getChargerPosition = (charger: Charger, index: number) => {
    // Use charger ID to get a consistent position
    const posIndex = parseInt(charger.chargerId, 10) % distributedPositions.length || index % distributedPositions.length;
    return distributedPositions[posIndex];
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-background via-muted/30 to-accent/20">
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Map roads */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Main roads */}
        <path d="M0 35 Q25 30 50 38 T100 32" stroke="hsl(var(--border))" strokeWidth="2" fill="none" />
        <path d="M0 55 Q35 60 65 50 T100 55" stroke="hsl(var(--border))" strokeWidth="2.5" fill="none" />
        <path d="M0 75 Q40 70 70 78 T100 72" stroke="hsl(var(--border))" strokeWidth="1.5" fill="none" />
        
        {/* Cross roads */}
        <path d="M25 0 Q28 35 22 55 T28 100" stroke="hsl(var(--border))" strokeWidth="1.5" fill="none" />
        <path d="M55 0 Q50 30 58 55 T52 100" stroke="hsl(var(--border))" strokeWidth="2" fill="none" />
        <path d="M82 0 Q78 40 85 65 T80 100" stroke="hsl(var(--border))" strokeWidth="1.5" fill="none" />
        
        {/* Highway / main route */}
        <path d="M0 48 Q20 45 40 52 Q60 58 80 50 Q90 47 100 48" stroke="hsl(var(--primary) / 0.3)" strokeWidth="4" fill="none" />
        
        {/* Park areas */}
        <ellipse cx="12" cy="70" rx="8" ry="10" fill="hsl(var(--success) / 0.1)" />
        <ellipse cx="88" cy="20" rx="7" ry="9" fill="hsl(var(--success) / 0.1)" />
        <ellipse cx="65" cy="80" rx="10" ry="7" fill="hsl(var(--success) / 0.1)" />
      </svg>

      {/* Charger pins - only render pins for actual chargers */}
      {chargers.map((charger, idx) => {
        const pos = getChargerPosition(charger, idx);
        const colorClass = statusColors[charger.status] || statusColors.available;
        
        return (
          <button
            key={charger.chargerId}
            onClick={() => onChargerClick?.(charger)}
            className={cn(
              "absolute transform -translate-x-1/2 -translate-y-full transition-all duration-200",
              "hover:scale-110 hover:z-10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full",
              colorClass
            )}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            title={charger.locationName}
          >
            <div className="relative drop-shadow-md">
              <svg width="28" height="36" viewBox="0 0 24 32" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20c0-6.6-5.4-12-12-12z" />
              </svg>
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                <Zap className="h-3 w-3 text-current" />
              </div>
            </div>
          </button>
        );
      })}

      {/* Map attribution */}
      <div className="absolute bottom-3 left-3 text-[10px] text-muted-foreground bg-background/90 backdrop-blur-sm px-2 py-1 rounded shadow-sm border border-border/50">
        © EMPower Map
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm border border-border/50">
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span className="text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">Charging</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-warning" />
            <span className="text-muted-foreground">Reserved</span>
          </div>
        </div>
      </div>
    </div>
  );
}
