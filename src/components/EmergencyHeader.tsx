import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";

const EmergencyHeader = () => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-extrabold text-primary-foreground">U</span>
          </div>
          <span className="text-lg font-bold text-foreground">Urgent Now</span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          <Link to="/">
            <Button
              variant={location.pathname === "/" ? "secondary" : "ghost"}
              size="sm"
            >
              Home
            </Button>
          </Link>
          <Link to="/results">
            <Button
              variant={location.pathname === "/results" ? "secondary" : "ghost"}
              size="sm"
            >
              Find Care
            </Button>
          </Link>
          <Link to="/first-aid">
            <Button
              variant={location.pathname === "/first-aid" ? "secondary" : "ghost"}
              size="sm"
            >
              First Aid
            </Button>
          </Link>
        </nav>

        <a href="tel:911">
          <Button
            size="sm"
            className="animate-pulse-gentle gap-1.5 bg-emergency font-bold text-emergency-foreground shadow-md hover:bg-emergency/90"
          >
            <Phone className="h-4 w-4" />
            <span>Call 911</span>
          </Button>
        </a>
      </div>

      {/* Mobile nav */}
      <div className="flex border-t sm:hidden">
        <Link to="/" className="flex-1">
          <Button
            variant="ghost"
            className={`w-full rounded-none text-xs ${location.pathname === "/" ? "bg-secondary" : ""}`}
            size="sm"
          >
            Home
          </Button>
        </Link>
        <Link to="/results" className="flex-1">
          <Button
            variant="ghost"
            className={`w-full rounded-none text-xs ${location.pathname === "/results" ? "bg-secondary" : ""}`}
            size="sm"
          >
            Find Care
          </Button>
        </Link>
        <Link to="/first-aid" className="flex-1">
          <Button
            variant="ghost"
            className={`w-full rounded-none text-xs ${location.pathname === "/first-aid" ? "bg-secondary" : ""}`}
            size="sm"
          >
            First Aid
          </Button>
        </Link>
      </div>
    </header>
  );
};

export default EmergencyHeader;
