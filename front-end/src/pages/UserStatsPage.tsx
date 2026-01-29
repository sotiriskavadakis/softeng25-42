import { useState } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { KPICard } from "@/components/ui/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Zap, 
  Leaf, 
  DollarSign, 
  Clock, 
  MapPin, 
  TrendingUp,
  Calendar,
  Download,
  FileText
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useUserStatsData } from "@/hooks/useUserStats";
import { useUserSessions } from "@/hooks/useUserSessions";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function UserStatsPage() {
  const { data: statsData, isLoading: statsLoading } = useUserStatsData();
  const { data: sessions = [], isLoading: sessionsLoading } = useUserSessions();
  const [statsType, setStatsType] = useState<"analytical" | "aggregated">("analytical");

  const stats = statsData?.stats;
  const monthlyUsage = statsData?.monthlyUsage || [];
  const recentSessions = sessions.filter((s) => !s.isActive).slice(0, 4);
  const isLoading = statsLoading || sessionsLoading;

  const handleExport = (exportFormat: "pdf" | "csv") => {
    toast({
      title: "Export Started",
      description: `Generating ${exportFormat.toUpperCase()} report...`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      
      <main className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between flex-wrap gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold">My Statistics</h1>
            <p className="text-muted-foreground">Track your charging journey</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Last 6 months
            </Badge>
            <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
              <FileText className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <KPICard
                title="Total Sessions"
                value={stats?.totalSessions || 0}
                icon={<Zap className="h-5 w-5" />}
              />
              <KPICard
                title="Energy Used"
                value={`${Math.round(stats?.totalKwh || 0).toLocaleString()} kWh`}
                icon={<TrendingUp className="h-5 w-5" />}
              />
              <KPICard
                title="Total Spent"
                value={`€${(stats?.totalSpent || 0).toFixed(2)}`}
                icon={<DollarSign className="h-5 w-5" />}
              />
              <KPICard
                title="CO₂ Saved"
                value={`${Math.round(stats?.co2Saved || 0)} kg`}
                icon={<Leaf className="h-5 w-5" />}
                className="bg-success/5 border-success/20"
              />
            </>
          )}
        </motion.div>

        {/* Stats Type Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Tabs value={statsType} onValueChange={(v) => setStatsType(v as "analytical" | "aggregated")}>
            <TabsList className="mb-4">
              <TabsTrigger value="analytical">Analytical (Last 6 Months)</TabsTrigger>
              <TabsTrigger value="aggregated">Aggregated</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analytical" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Energy Usage (kWh)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-[180px] w-full" />
                    ) : monthlyUsage.length > 0 ? (
                      <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={monthlyUsage}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                            <Tooltip />
                            <Bar dataKey="totalKwh" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="kWh" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-[180px] flex items-center justify-center text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Cost Over Time (€)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-[180px] w-full" />
                    ) : monthlyUsage.length > 0 ? (
                      <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={monthlyUsage}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                            <Tooltip />
                            <Line type="monotone" dataKey="totalCost" stroke="hsl(var(--primary))" strokeWidth={2} name="Cost (€)" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-[180px] flex items-center justify-center text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="aggregated" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Aggregated Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select a date range for periods older than 6 months to view pre-calculated summaries.
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-secondary/30 rounded-xl">
                      <p className="text-2xl font-bold">{stats?.totalSessions || 0}</p>
                      <p className="text-xs text-muted-foreground">Total Sessions</p>
                    </div>
                    <div className="p-4 bg-secondary/30 rounded-xl">
                      <p className="text-2xl font-bold">{Math.round(stats?.totalKwh || 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total kWh</p>
                    </div>
                    <div className="p-4 bg-secondary/30 rounded-xl">
                      <p className="text-2xl font-bold">€{(stats?.totalSpent || 0).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Total Spent</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Additional Stats & Recent Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-3 gap-4"
        >
          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Avg Session
                    </div>
                    <span className="font-semibold">{stats?.averageSessionDuration || 0} min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      Favorite Location
                    </div>
                    <span className="font-semibold text-right text-sm">{stats?.favoriteLocation || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      Avg Cost
                    </div>
                    <span className="font-semibold">
                      €{stats?.totalSessions ? ((stats.totalSpent || 0) / stats.totalSessions).toFixed(2) : "0.00"}/session
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Zap className="h-4 w-4" />
                      Avg per kWh
                    </div>
                    <span className="font-semibold">
                      €{stats?.totalKwh ? ((stats.totalSpent || 0) / stats.totalKwh).toFixed(3) : "0.000"}/kWh
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Sessions</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <a href="/sessions">View All</a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : recentSessions.length > 0 ? (
                <div className="space-y-3">
                  {recentSessions.map((session) => (
                    <div
                      key={session.sessionId}
                      className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Zap className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{session.locationName}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(session.startTime), "MMM d, yyyy • h:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">€{session.totalCost.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {session.totalKwh.toFixed(1)} kWh
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No sessions yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
