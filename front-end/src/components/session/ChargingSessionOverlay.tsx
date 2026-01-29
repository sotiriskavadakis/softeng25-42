import { SessionMetrics } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Zap, 
  Battery, 
  Clock, 
  X, 
  StopCircle,
  Leaf,
  TrendingUp,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";

interface ChargingSessionOverlayProps {
  chargerName: string;
  metrics: SessionMetrics;
  onStop: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function ChargingSessionOverlay({ 
  chargerName, 
  metrics,
  onStop, 
  onClose,
  isLoading = false,
}: ChargingSessionOverlayProps) {
  const co2Saved = (metrics.energyDelivered * 0.45).toFixed(1);
  const formatDuration = (mins: number) => {
    const m = Math.floor(mins);
    const s = Math.floor((mins % 1) * 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Estimate the starting battery level (45% as default)
  const startingBattery = 45;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-sm"
      >
        <Card className="shadow-2xl border-primary/30 overflow-hidden">
          {/* Animated top bar */}
          <div className="h-1.5 bg-gradient-to-r from-primary via-primary-glow to-primary animate-pulse" />
          
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-xs font-medium text-success uppercase tracking-wide">Live</span>
                </div>
                <h2 className="text-lg font-bold mt-1">Charging Session</h2>
                <p className="text-sm text-muted-foreground">{chargerName}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 -mr-2 -mt-1">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Power Display */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-36 h-36 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center animate-charging-pulse">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <div className="text-center">
                      <Zap className="h-5 w-5 text-primary mx-auto mb-1" />
                      <p className="text-3xl font-bold text-foreground">
                        {metrics.currentPower.toFixed(0)}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">kW</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Battery Progress */}
            <div className="mb-5">
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex items-center gap-1.5">
                  <Battery className="h-4 w-4 text-success" />
                  <span className="font-medium">Battery</span>
                </div>
                <span className="font-bold text-lg">{metrics.batteryLevel.toFixed(0)}%</span>
              </div>
              <Progress value={metrics.batteryLevel} className="h-3" />
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1.5">
                <span>Started at {startingBattery}%</span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-success" />
                  +{(metrics.batteryLevel - startingBattery).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <Zap className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold">{metrics.energyDelivered.toFixed(1)}</p>
                <p className="text-[10px] text-muted-foreground uppercase">kWh delivered</p>
              </div>

              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <Clock className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold">{metrics.estimatedTimeRemaining.toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground uppercase">min remaining</p>
              </div>

              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <span className="text-primary font-bold text-sm">€</span>
                <p className="text-xl font-bold">{metrics.cost.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground uppercase">current cost</p>
              </div>

              <div className="bg-success/10 rounded-xl p-3 text-center">
                <Leaf className="h-4 w-4 text-success mx-auto mb-1" />
                <p className="text-xl font-bold text-success">{co2Saved}</p>
                <p className="text-[10px] text-muted-foreground uppercase">kg CO₂ saved</p>
              </div>
            </div>

            {/* Duration */}
            <div className="text-center mb-5 py-2 px-3 bg-muted/30 rounded-lg">
              <span className="text-xs text-muted-foreground">Session duration: </span>
              <span className="font-mono font-semibold">{formatDuration(metrics.duration)}</span>
            </div>

            {/* Stop Button */}
            <Button 
              variant="destructive" 
              size="lg" 
              className="w-full gap-2"
              onClick={onStop}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Ending Session...
                </>
              ) : (
                <>
                  <StopCircle className="h-5 w-5" />
                  Stop Charging • Pay €{metrics.cost.toFixed(2)}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
