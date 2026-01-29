import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LocationSearchProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  className?: string;
}

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export function LocationSearch({ onLocationSelect, className }: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize Google Places services
  useEffect(() => {
    if (window.google?.maps?.places) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      // PlacesService needs a DOM element or map
      const dummyDiv = document.createElement("div");
      placesService.current = new google.maps.places.PlacesService(dummyDiv);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch predictions with debounce
  const fetchPredictions = useCallback((input: string) => {
    if (!autocompleteService.current || input.length < 2) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);
    autocompleteService.current.getPlacePredictions(
      {
        input,
        types: ["geocode", "establishment"],
      },
      (results, status) => {
        setIsLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results.slice(0, 5));
          setIsOpen(true);
        } else {
          setPredictions([]);
        }
      }
    );
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Debounce API calls
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      fetchPredictions(value);
    }, 300);
  };

  const handleSelectPrediction = (prediction: Prediction) => {
    if (!placesService.current) return;

    setIsLoading(true);
    placesService.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ["geometry", "formatted_address"],
      },
      (place, status) => {
        setIsLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: place.formatted_address || prediction.description,
          };
          onLocationSelect(location);
          setQuery(prediction.structured_formatting.main_text);
          setIsOpen(false);
          setPredictions([]);
        }
      }
    );
  };

  const handleClear = () => {
    setQuery("");
    setPredictions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search for a location..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => predictions.length > 0 && setIsOpen(true)}
          className="pl-10 pr-10 bg-background"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Predictions dropdown */}
      {isOpen && predictions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              onClick={() => handleSelectPrediction(prediction)}
              className="w-full flex items-start gap-3 p-3 text-left hover:bg-muted transition-colors"
            >
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">
                  {prediction.structured_formatting.main_text}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {prediction.structured_formatting.secondary_text}
                </div>
              </div>
            </button>
          ))}
          <div className="px-3 py-2 text-[10px] text-muted-foreground border-t border-border bg-muted/50">
            Powered by Google
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 p-3 text-sm text-muted-foreground">
          Searching...
        </div>
      )}
    </div>
  );
}
