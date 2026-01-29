import { useState } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  Clock, 
  MapPin, 
  BatteryCharging, 
  CalendarClock,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { useUserSessions, useUserReservations } from "@/hooks/useUserSessions";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function SessionsPage() {
  const [activeTab, setActiveTab] = useState<"active" | "reserved">("active");
  const { data: sessions = [], isLoading: sessionsLoading } = useUserSessions();
  const { data: reservations = [], isLoading: reservationsLoading } = useUserReservations();

  const activeSessions = sessions.filter((s) => s.isActive);
  const isLoading = sessionsLoading || reservationsLoading;

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <main className="p-4 md:p-6 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-foreground">Charging Sessions</h1>
          <p className="text-muted-foreground">Manage your active and upcoming sessions</p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-6"
        >
          <button
            onClick={() => setActiveTab("active")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all",
              activeTab === "active"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <BatteryCharging className="h-4 w-4" />
            Active
            {activeSessions.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-primary-foreground/20 text-primary-foreground">
                {activeSessions.length}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab("reserved")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all",
              activeTab === "reserved"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <CalendarClock className="h-4 w-4" />
            Reserved
            {reservations.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {reservations.length}
              </Badge>
            )}
          </button>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                    <div className="flex-1">
                      <Skeleton className="h-6 w-48 mb-2" />
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex-1">
                      <Skeleton className="h-8 w-full" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Sessions List */}
        {!isLoading && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-4"
            >
              {activeTab === "active" && activeSessions.map((session) => {
                const startTime = new Date(session.startTime);
                const duration = differenceInMinutes(new Date(), startTime);
                // Simulate progress based on duration (max 60 min)
                const progress = Math.min(Math.round((duration / 60) * 100), 100);

                return (
                  <motion.div key={session.sessionId} variants={itemVariants}>
                    <Card className="overflow-hidden border border-border hover:border-primary/30 transition-colors">
                      <div className="h-1 bg-gradient-to-r from-primary via-primary-glow to-primary animate-pulse" />
                      <CardContent className="p-5">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                          {/* Left: Session Info */}
                          <div className="flex-1">
                            <div className="flex items-start gap-3">
                              <div className="p-2.5 rounded-xl shrink-0 bg-primary/10">
                                <BatteryCharging className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h2 className="font-semibold text-foreground">{session.locationName}</h2>
                                  <Badge variant="default" className="text-xs">
                                    Charging
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                                  <MapPin className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{session.locationAddress}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Zap className="h-3 w-3" />
                                    {session.maxPowerKw} kW
                                  </span>
                                  <span>{session.connectorType}</span>
                                  <span className="text-muted-foreground/60">ID: {session.sessionId}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Center: Progress */}
                          <div className="flex-1">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-semibold text-primary">{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-2.5" />
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{session.totalKwh.toFixed(1)} kWh delivered</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {duration} min elapsed
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Action */}
                          <div className="flex items-center gap-3 lg:flex-col lg:items-end">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-foreground">€{session.totalCost.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">current cost</p>
                            </div>
                            <Button 
                              variant="destructive"
                              size="sm"
                              className="gap-1.5 whitespace-nowrap"
                            >
                              Stop & Pay
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}

              {activeTab === "reserved" && reservations.map((reservation) => (
                <motion.div key={reservation.reservationId} variants={itemVariants}>
                  <Card className="overflow-hidden border border-border hover:border-primary/30 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                        {/* Left: Reservation Info */}
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-xl shrink-0 bg-warning/10">
                              <CalendarClock className="h-5 w-5 text-warning" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="font-semibold text-foreground">{reservation.locationName}</h2>
                                <Badge variant="secondary" className="text-xs">
                                  Reserved
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">{reservation.locationAddress}</span>
                              </div>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Zap className="h-3 w-3" />
                                  {reservation.maxPowerKw} kW
                                </span>
                                <span>{reservation.connectorType}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Center: Reservation Time */}
                        <div className="flex-1">
                          <div className="bg-warning/5 border border-warning/20 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-warning">
                              <CalendarClock className="h-4 w-4" />
                              <span className="font-medium text-sm">Reservation</span>
                            </div>
                            <p className="text-sm text-foreground mt-1">
                              {format(new Date(reservation.startTime), "MMM d, yyyy • h:mm a")}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {reservation.durationMinutes} min session reserved
                            </p>
                          </div>
                        </div>

                        {/* Right: Action */}
                        <div className="flex items-center gap-3 lg:flex-col lg:items-end">
                          <Button 
                            variant="outline"
                            size="sm"
                            className="gap-1.5 whitespace-nowrap"
                          >
                            View Details
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {/* Empty State */}
              {((activeTab === "active" && activeSessions.length === 0) ||
                (activeTab === "reserved" && reservations.length === 0)) && (
                <motion.div variants={itemVariants}>
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">
                        No {activeTab} sessions
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        {activeTab === "active" 
                          ? "You don't have any active charging sessions. Start a new session from the map."
                          : "You don't have any reservations. Reserve a charger to guarantee availability."
                        }
                      </p>
                      <Button className="mt-4" variant="outline" asChild>
                        <a href="/">
                          <MapPin className="h-4 w-4 mr-2" />
                          Find Chargers
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
