import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function KPICard({ title, value, subtitle, icon, trend, className }: KPICardProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-xl border border-border p-4 md:p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20 group",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs md:text-sm text-muted-foreground font-medium truncate">{title}</p>
          <p className="text-xl md:text-2xl font-bold mt-1 text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "text-xs font-medium mt-2 flex items-center gap-1",
              trend.isPositive ? "text-success" : "text-destructive"
            )}>
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{Math.abs(trend.value)}% vs last month</span>
            </div>
          )}
        </div>
        <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary/15 transition-colors">
          {icon}
        </div>
      </div>
    </div>
  );
}
