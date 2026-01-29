import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Filter, RotateCcw, Search, Zap, Info, Clock } from "lucide-react";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, addHours, setHours, setMinutes } from "date-fns";

export interface FilterState {
  status: string[];
  powerRange: [number, number];
  availableAfter: Date | null;
}

interface SearchFiltersProps {
  onSearch: (filters: FilterState) => void;
  onClear: () => void;
}

// Available statuses from the API (matches normalizeStatus in points.ts)
const STATUS_OPTIONS = [
  { id: "AVAILABLE", label: "Available", color: "bg-success", description: "Ready to charge" },
  { id: "BUSY", label: "Busy/Occupied", color: "bg-warning", description: "Currently in use" },
  { id: "OFFLINE", label: "Offline", color: "bg-muted-foreground", description: "Not operational" },
];

// Power range from dataset (based on API cap field)
const POWER_MIN = 2;
const POWER_MAX = 350;

export function SearchFilters({ onSearch, onClear }: SearchFiltersProps) {
  const now = new Date();
  
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["AVAILABLE"]);
  const [powerRange, setPowerRange] = useState<[number, number]>([POWER_MIN, POWER_MAX]);
  const [selectedHoursAhead, setSelectedHoursAhead] = useState<string>("");

  // Generate hours ahead options (1-24)
  const hoursAheadOptions = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      value: (i + 1).toString(),
      label: i + 1 === 1 ? "1 hour" : `${i + 1} hours`,
    }));
  }, []);

  // Calculate the target time based on hours ahead
  const availableAfterTime = useMemo(() => {
    if (!selectedHoursAhead) return null;
    return addHours(now, parseInt(selectedHoursAhead));
  }, [selectedHoursAhead, now]);

  const toggleStatus = (statusId: string) => {
    setSelectedStatuses(prev => 
      prev.includes(statusId)
        ? prev.filter(s => s !== statusId)
        : [...prev, statusId]
    );
  };

  const clearAvailableAfter = () => {
    setSelectedHoursAhead("");
  };

  const handleSearch = () => {
    onSearch({
      status: selectedStatuses,
      powerRange,
      availableAfter: availableAfterTime,
    });
  };

  const handleClear = () => {
    setSelectedStatuses(["AVAILABLE"]);
    setPowerRange([POWER_MIN, POWER_MAX]);
    clearAvailableAfter();
    onClear();
  };

  const hasActiveFilters = 
    selectedStatuses.length !== 1 || 
    selectedStatuses[0] !== "AVAILABLE" ||
    powerRange[0] !== POWER_MIN || 
    powerRange[1] !== POWER_MAX ||
    selectedHoursAhead !== "";

  return (
    <TooltipProvider>
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Search Filters</h2>
          </div>
          {hasActiveFilters && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </div>

        <div className="p-5 space-y-6">
          {/* Status Filter (Multi-select) */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">
              Status
            </label>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status.id}
                  onClick={() => toggleStatus(status.id)}
                  className={cn(
                    "w-full px-3 py-2.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-3",
                    selectedStatuses.includes(status.id)
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background border-border text-foreground hover:border-primary/50 hover:bg-accent/50"
                  )}
                >
                  <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", status.color)} />
                  <div className="flex-1 text-left">
                    <span>{status.label}</span>
                    <p className={cn(
                      "text-xs font-normal mt-0.5",
                      selectedStatuses.includes(status.id) 
                        ? "text-primary-foreground/70" 
                        : "text-muted-foreground"
                    )}>
                      {status.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            {selectedStatuses.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">Select at least one status</p>
            )}
          </div>

          {/* Power Range Slider */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">
              Power Range (kW)
            </label>
            <div className="bg-muted/50 rounded-lg p-4">
              <Slider
                value={powerRange}
                onValueChange={(val) => setPowerRange(val as [number, number])}
                min={POWER_MIN}
                max={POWER_MAX}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between items-center text-xs mt-3">
                <span className="text-muted-foreground">{POWER_MIN} kW</span>
                <span className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                  <Zap className="h-3 w-3" />
                  {powerRange[0]} - {powerRange[1]} kW
                </span>
                <span className="text-muted-foreground">{POWER_MAX} kW</span>
              </div>
            </div>
          </div>

          {/* Power Info */}
          <div className="bg-muted/30 rounded-lg p-3 border border-dashed border-border">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Info className="h-3.5 w-3.5 shrink-0" />
              Power is based on charger capacity (cap) from the API
            </p>
          </div>

          {/* Available After Time Picker - Simplified to hours ahead */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Available chargers after
            </label>
            <p className="text-xs text-muted-foreground">
              Find chargers that will be available within the next 24 hours
            </p>

            <Select value={selectedHoursAhead} onValueChange={setSelectedHoursAhead}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select time ahead..." />
              </SelectTrigger>
              <SelectContent>
                {hoursAheadOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label} from now
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Preview selected time */}
            {availableAfterTime && (
              <div className="bg-primary/10 rounded-lg p-3 flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-muted-foreground">After: </span>
                  <span className="font-medium text-primary">
                    {format(availableAfterTime, "EEE, MMM d 'at' HH:mm")}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAvailableAfter}
                  className="h-7 px-2 text-xs"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 p-5 pt-0">
          <Button 
            variant="outline" 
            className="flex-1 gap-2" 
            onClick={handleClear}
            disabled={!hasActiveFilters}
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button 
            className="flex-1 gap-2" 
            onClick={handleSearch}
            disabled={selectedStatuses.length === 0}
          >
            <Search className="h-4 w-4" />
            Apply
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
