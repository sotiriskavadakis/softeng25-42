import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl font-bold text-gradient mb-4">404</div>
        <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Link>
          </Button>
          <Button asChild>
            <Link to="/map">
              <Home className="h-4 w-4" />
              Go to Map
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
