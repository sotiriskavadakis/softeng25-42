import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Filter, RotateCcw, Search, Zap, Clock, Plug, DollarSign } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export interface FilterState {
  status: string[];
  powerRange: [number, number];
  availableWithinMinutes: number | null;
  kwhPriceMax: number | null;
  connectorType: string | null;
}

interface SearchFiltersProps {
  onSearch: (filters: FilterState) => void;
  onClear: () => void;
  isMobile?: boolean;
}

// Available statuses from the API
const STATUS_OPTIONS = [
  { id: "AVAILABLE", label: "Available", color: "bg-success" },
  { id: "BUSY", label: "Busy", color: "bg-warning" },
  { id: "OFFLINE", label: "Offline", color: "bg-muted-foreground" },
];

// Connector types - placeholder until API supports
const CONNECTOR_TYPES = [
  { id: "CCS2", label: "CCS2" },
  { id: "TYPE2", label: "Type 2" },
  { id: "CHADEMO", label: "CHAdeMO" },
];

// Quick time options
const TIME_OPTIONS = [
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "60", label: "1 hour" },
  { value: "120", label: "2 hours" },
];

// Power range
const POWER_MIN = 2;
const POWER_MAX = 350;

export function SearchFilters({ onSearch, onClear, isMobile = false }: SearchFiltersProps) {
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["AVAILABLE"]);
  const [powerRange, setPowerRange] = useState<[number, number]>([POWER_MIN, POWER_MAX]);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedConnector, setSelectedConnector] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  const toggleStatus = (statusId: string) => {
    setSelectedStatuses(prev => 
      prev.includes(statusId)
        ? prev.filter(s => s !== statusId)
        : [...prev, statusId]
    );
  };

  const handleSearch = () => {
    onSearch({
      status: selectedStatuses,
      powerRange,
      availableWithinMinutes: selectedTime ? parseInt(selectedTime) : null,
      kwhPriceMax: maxPrice ? parseFloat(maxPrice) : null,
      connectorType: selectedConnector || null,
    });
  };

  const handleClear = () => {
    setSelectedStatuses(["AVAILABLE"]);
    setPowerRange([POWER_MIN, POWER_MAX]);
    setSelectedTime("");
    setSelectedConnector("");
    setMaxPrice("");
    onClear();
  };

  const hasActiveFilters = 
    selectedStatuses.length !== 1 || 
    selectedStatuses[0] !== "AVAILABLE" ||
    powerRange[0] !== POWER_MIN || 
    powerRange[1] !== POWER_MAX ||
    selectedTime !== "" ||
    selectedConnector !== "" ||
    maxPrice !== "";

  return (
    <div className={cn(
      "overflow-hidden",
      !isMobile && "bg-card rounded-xl border border-border shadow-sm"
    )}>
      {/* Header - hide on mobile since sheet has its own header */}
      {!isMobile && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">Filters</h2>
          </div>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">Active</Badge>
          )}
        </div>
      )}

      <div className={cn("space-y-5", isMobile ? "pb-4" : "p-4")}>
        {/* Status Filter - Compact chips */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
            Status
          </label>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status.id}
                onClick={() => toggleStatus(status.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5",
                  selectedStatuses.includes(status.id)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <div className={cn("w-2 h-2 rounded-full", status.color)} />
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Power Range Slider */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
            Power Range
          </label>
          <div className="px-1">
            <Slider
              value={powerRange}
              onValueChange={(val) => setPowerRange(val as [number, number])}
              min={POWER_MIN}
              max={POWER_MAX}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between items-center text-xs mt-2">
              <span className="text-muted-foreground">{POWER_MIN} kW</span>
              <span className="flex items-center gap-1 text-primary font-medium">
                <Zap className="h-3 w-3" />
                {powerRange[0]} - {powerRange[1]} kW
              </span>
              <span className="text-muted-foreground">{POWER_MAX} kW</span>
            </div>
          </div>
        </div>

        {/* kWh Price - Coming soon */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <DollarSign className="h-3 w-3" />
            Max Price (€/kWh)
            <Badge variant="outline" className="text-[10px] py-0">Soon</Badge>
          </label>
          <Select value={maxPrice} onValueChange={setMaxPrice} disabled>
            <SelectTrigger className="w-full h-9 text-sm opacity-50">
              <SelectValue placeholder="Any price" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.25">≤ €0.25/kWh</SelectItem>
              <SelectItem value="0.35">≤ €0.35/kWh</SelectItem>
              <SelectItem value="0.45">≤ €0.45/kWh</SelectItem>
              <SelectItem value="0.55">≤ €0.55/kWh</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Connector Type - Coming soon */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Plug className="h-3 w-3" />
            Connector Type
            <Badge variant="outline" className="text-[10px] py-0">Soon</Badge>
          </label>
          <div className="flex flex-wrap gap-2">
            {CONNECTOR_TYPES.map((type) => (
              <button
                key={type.id}
                disabled
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Available Within - Simplified */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            Available Within
          </label>
          <div className="flex flex-wrap gap-2">
            {TIME_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedTime(selectedTime === option.value ? "" : option.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  selectedTime === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          {selectedTime && (
            <p className="text-xs text-muted-foreground mt-2">
              Show chargers becoming available within {selectedTime === "60" ? "1 hour" : selectedTime === "120" ? "2 hours" : `${selectedTime} minutes`}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className={cn(
        "flex gap-2",
        isMobile ? "pt-4 border-t border-border" : "p-4 pt-0"
      )}>
        <Button 
          variant="outline" 
          size={isMobile ? "default" : "sm"}
          className="flex-1 gap-1.5" 
          onClick={handleClear}
          disabled={!hasActiveFilters}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
        <Button 
          size={isMobile ? "default" : "sm"}
          className="flex-1 gap-1.5" 
          onClick={handleSearch}
          disabled={selectedStatuses.length === 0}
        >
          <Search className="h-3.5 w-3.5" />
          Apply Filters
        </Button>
      </div>
    </div>
  );
}
