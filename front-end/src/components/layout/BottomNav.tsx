import { Link, useLocation } from "react-router-dom";
import { Map, User, BarChart3, LogOut, Shield } from "lucide-react";
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            to="/admin/network"
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200",
              location.pathname === "/admin/network"
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Shield className="h-5 w-5" />
            <span className="text-xs font-medium">Admin</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
