import { Activity, Wifi, WifiOff, Zap, AlertCircle } from "lucide-react";
import { useHealthCheck, getHealthCheckErrorMessage } from "@/hooks/useHealthCheck";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface HealthCheckWidgetProps {
  className?: string;
  compact?: boolean;
}

export function HealthCheckWidget({ className, compact = false }: HealthCheckWidgetProps) {
  const { data: health, isLoading, error, isRefetching } = useHealthCheck();

  if (isLoading) {
    return (
      <div className={cn("bg-card rounded-lg border border-border p-4", className)}>
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("bg-card rounded-lg border border-destructive/30 p-4", className)}>
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">System Error</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {getHealthCheckErrorMessage(error)}
        </p>
      </div>
    );
  }

  if (!health) return null;

  const isHealthy = health.status === "OK";
  const onlinePercent = health.totalPoints > 0 
    ? Math.round((health.onlinePoints / health.totalPoints) * 100) 
    : 0;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3 text-sm", className)}>
        <div className={cn(
          "flex items-center gap-1.5",
          isHealthy ? "text-success" : "text-destructive"
        )}>
          {isHealthy ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          <span className="font-medium">{health.status}</span>
        </div>
        <span className="text-muted-foreground">
          {health.onlinePoints}/{health.totalPoints} online
        </span>
        {isRefetching && (
          <Activity className="h-3.5 w-3.5 text-primary animate-pulse" />
        )}
      </div>
    );
  }

  return (
    <div className={cn("bg-card rounded-lg border border-border p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isHealthy ? "bg-success animate-pulse" : "bg-destructive"
          )} />
          <span className="text-sm font-medium">System Status</span>
        </div>
        <div className={cn(
          "flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full",
          isHealthy 
            ? "bg-success/10 text-success" 
            : "bg-destructive/10 text-destructive"
        )}>
          {isHealthy ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {health.status}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <div className="text-xs text-muted-foreground mb-1">Total</div>
          <div className="text-lg font-bold text-foreground">{health.totalPoints}</div>
        </div>
        <div className="bg-success/10 rounded-lg p-3 text-center">
          <div className="text-xs text-success mb-1">Online</div>
          <div className="text-lg font-bold text-success">{health.onlinePoints}</div>
        </div>
        <div className="bg-destructive/10 rounded-lg p-3 text-center">
          <div className="text-xs text-destructive mb-1">Offline</div>
          <div className="text-lg font-bold text-destructive">{health.offlinePoints}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">Availability</span>
          <span className="font-medium">{onlinePercent}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-success transition-all duration-500"
            style={{ width: `${onlinePercent}%` }}
          />
        </div>
      </div>

      {isRefetching && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-3">
          <Activity className="h-3 w-3 animate-pulse" />
          Refreshing...
        </div>
      )}
    </div>
  );
}
