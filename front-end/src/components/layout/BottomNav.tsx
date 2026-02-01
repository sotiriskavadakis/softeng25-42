import { Link, useLocation } from "react-router-dom";
import { Map, User, BarChart3, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/useUserRole";

const navItems = [
  { to: "/", icon: Map, label: "Map" },
  { to: "/stats", icon: BarChart3, label: "Stats" },
  { to: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const location = useLocation();
  const { isAdmin } = useIsAdmin();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg md:hidden safe-area-bottom">
      <div className="flex items-center justify-around py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-xl transition-all duration-200 min-w-[4rem]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-colors",
                isActive && "bg-primary/10"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            to="/admin/network"
            className={cn(
              "flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-xl transition-all duration-200 min-w-[4rem]",
              location.pathname === "/admin/network"
                ? "text-primary"
                : "text-muted-foreground active:text-foreground"
            )}
          >
            <div className={cn(
              "p-1.5 rounded-lg transition-colors",
              location.pathname === "/admin/network" && "bg-primary/10"
            )}>
              <Shield className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-medium">Admin</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
