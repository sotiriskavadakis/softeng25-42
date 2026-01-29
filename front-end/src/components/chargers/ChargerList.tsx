import { useState } from "react";
import { Charger, ChargerFilter, ChargerStatus, CHARGER_STATUS_LABELS } from "@/types";
import { ChargerCard } from "./ChargerCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";

interface ChargerListProps {
  chargers: Charger[];
  selectedChargerId?: string;
  onSelectCharger: (charger: Charger) => void;
}

export function ChargerList({ chargers, selectedChargerId, onSelectCharger }: ChargerListProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ChargerFilter>({});

  const toggleStatus = (status: ChargerStatus) => {
    setFilters(prev => {
      const currentStatuses = prev.status || [];
      const newStatuses = currentStatuses.includes(status)
        ? currentStatuses.filter(s => s !== status)
        : [...currentStatuses, status];
      return { ...prev, status: newStatuses.length > 0 ? newStatuses : undefined };
    });
  };

  const filteredChargers = chargers.filter(charger => {
    if (filters.status && filters.status.length > 0 && !filters.status.includes(charger.status)) {
      return false;
    }
    if (filters.minPower && charger.maxPowerKw < filters.minPower) {
      return false;
    }
    if (filters.connectorType && charger.typeName !== filters.connectorType) {
      return false;
    }
    return true;
  });

  const availableCount = chargers.filter(c => c.status === "available").length;
  const connectorTypes = [...new Set(chargers.map(c => c.typeName))];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Nearby Chargers</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {availableCount} available of {chargers.length} total
            </p>
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="icon-sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
          </Button>
        </div>

        {showFilters && (
          <div className="pt-3 space-y-3 border-t border-border mt-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Status</p>
              <div className="flex flex-wrap gap-2">
                {(["available", "occupied", "reserved", "faulted", "offline"] as ChargerStatus[]).map(status => (
                  <Badge
                    key={status}
                    variant={filters.status?.includes(status) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleStatus(status)}
                  >
                    {CHARGER_STATUS_LABELS[status]}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Min Power</p>
              <div className="flex gap-2">
                {[22, 50, 150].map(power => (
                  <Badge
                    key={power}
                    variant={filters.minPower === power ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setFilters(prev => ({
                      ...prev,
                      minPower: prev.minPower === power ? undefined : power
                    }))}
                  >
                    {power}+ kW
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Connector Type</p>
              <div className="flex flex-wrap gap-2">
                {connectorTypes.map(type => (
                  <Badge
                    key={type}
                    variant={filters.connectorType === type ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setFilters(prev => ({
                      ...prev,
                      connectorType: prev.connectorType === type ? undefined : type
                    }))}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-3 pt-0">
        {filteredChargers.map(charger => (
          <ChargerCard
            key={charger.chargerId}
            charger={charger}
            isSelected={charger.chargerId === selectedChargerId}
            onClick={() => onSelectCharger(charger)}
          />
        ))}
        {filteredChargers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No chargers match your filters</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
