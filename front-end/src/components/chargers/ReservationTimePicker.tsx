import { useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReservationTimePickerProps {
  onConfirm: (durationMinutes: number) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const DURATION_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" },
];

export function ReservationTimePicker({ 
  onConfirm, 
  onCancel, 
  isLoading = false 
}: ReservationTimePickerProps) {
  const [selectedDuration, setSelectedDuration] = useState<number>(30);

  const handleConfirm = () => {
    onConfirm(selectedDuration);
  };

  // Calculate end time for preview
  const endTime = new Date(Date.now() + selectedDuration * 60 * 1000);
  const endTimeFormatted = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-4 p-1">
      <div className="text-sm font-medium text-foreground">
        Select reservation duration
      </div>
      <p className="text-xs text-muted-foreground">
        How long do you want to reserve this charger?
      </p>

      {/* Duration Selection */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          Duration
        </label>
        <div className="grid grid-cols-4 gap-2">
          {DURATION_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={selectedDuration === option.value ? "default" : "outline"}
              size="sm"
              className={cn(
                "text-sm",
                selectedDuration === option.value && "ring-2 ring-primary/50"
              )}
              onClick={() => setSelectedDuration(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Selected Duration Preview */}
      <div className="bg-muted/50 rounded-lg p-3 text-center">
        <p className="text-xs text-muted-foreground mb-1">Reservation until approximately</p>
        <p className="font-semibold text-primary text-lg">
          {endTimeFormatted}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          ({selectedDuration} minutes from now)
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button 
          variant="outline" 
          className="flex-1" 
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          className="flex-1" 
          onClick={handleConfirm}
          disabled={isLoading}
        >
          {isLoading ? "Reserving..." : "Confirm"}
        </Button>
      </div>
    </div>
  );
}
