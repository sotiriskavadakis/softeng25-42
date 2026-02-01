import { Wifi, WifiOff, Activity } from "lucide-react";
import { useHealthCheck } from "@/hooks/useHealthCheck";
import { cn } from "@/lib/utils";

interface SystemStatusBadgeProps {
  className?: string;
}

export function SystemStatusBadge({ className }: SystemStatusBadgeProps) {
  const { data: health, isLoading, error, isRefetching } = useHealthCheck();

  if (isLoading) {
    return (
      <div className={cn("bg-background/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md border border-border/50", className)}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="h-3 w-3 animate-pulse" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !health) {
    return (
      <div className={cn("bg-background/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md border border-destructive/30", className)}>
        <div className="flex items-center gap-2 text-xs text-destructive">
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
        </div>
      </div>
    );
  }

  const isHealthy = health.status === "OK";
  const onlinePercent = health.totalPoints > 0 
    ? Math.round((health.onlinePoints / health.totalPoints) * 100) 
    : 0;

  return (
    <div className={cn("bg-background/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md border border-border/50", className)}>
      <div className="flex items-center gap-3 text-xs">
        <div className={cn(
          "flex items-center gap-1.5",
          isHealthy ? "text-success" : "text-destructive"
        )}>
          {isHealthy ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          <span className="font-medium">{health.status}</span>
        </div>
        <div className="h-3 w-px bg-border" />
        <span className="text-muted-foreground">
          <strong className="text-foreground">{health.onlinePoints}</strong>/{health.totalPoints} online
        </span>
        {isRefetching && (
          <Activity className="h-3 w-3 text-primary animate-pulse" />
        )}
      </div>
    </div>
  );
}
