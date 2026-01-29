import { useState, useEffect } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Car, 
  CreditCard, 
  Bell,
  Shield,
  ChevronRight,
  Edit2,
  Zap,
  Leaf,
  Check,
  Sun,
  Moon,
  Monitor,
  Calendar,
  Wallet,
  Settings,
  LogOut,
  MapPin,
  Battery
} from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useUserProfile, useUpdateProfile, useSavedCards } from "@/hooks/useUserProfile";
import { useUserStatsData } from "@/hooks/useUserStats";
import { useAllChargersStats } from "@/hooks/useAllChargers";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function ProfilePage() {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: statsData, isLoading: statsLoading } = useUserStatsData();
  const { data: savedCards = [], isLoading: cardsLoading } = useSavedCards();
  const { stats: chargerStats } = useAllChargersStats();
  const updateProfile = useUpdateProfile();
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  // Initialize form when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      toast({
        title: "Profile Updated",
        description: "Your changes have been saved.",
      });
      setIsEditing(false);
    } catch {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = () => {
    logout();
    toast({
      title: "Signed Out",
      description: "You have been signed out successfully.",
    });
  };

  const displayName = profile 
    ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || profile.username || "User"
    : "User";
  
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const stats = statsData?.stats;
  const isLoading = profileLoading || statsLoading;

  const memberSince = profile?.createdAt 
    ? format(new Date(profile.createdAt), "MMMM yyyy")
    : "N/A";

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      
      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 md:p-6 pb-24 space-y-5 max-w-2xl mx-auto"
      >
        {/* Profile Header Card */}
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-none shadow-lg">
            <div className="h-24 bg-gradient-to-br from-primary via-primary/80 to-primary-glow relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnYtMmgtNHYyaC0ydjJoMnY0aDJ2MmgtMnY0aDR2LTJoMnYtNGgtMnYtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
            </div>
            <CardContent className="pt-0 -mt-12 relative">
              {isLoading ? (
                <div className="flex flex-col items-center">
                  <Skeleton className="w-24 h-24 rounded-full" />
                  <Skeleton className="h-6 w-32 mt-3" />
                  <Skeleton className="h-4 w-48 mt-2" />
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-xl border-4 border-background ring-4 ring-primary/20">
                    {initials}
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-center gap-2">
                      <h2 className="text-xl font-bold">{displayName}</h2>
                      <Badge className="bg-success/15 text-success border-success/30 gap-1 text-xs">
                        <Check className="h-3 w-3" />
                        Verified
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">{profile?.email}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Member since {memberSince}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-2">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-bold text-primary">{stats?.totalSessions || 0}</p>
              <p className="text-xs text-muted-foreground">Sessions</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-2">
                <Battery className="h-5 w-5 text-success" />
              </div>
              <p className="text-2xl font-bold text-success">{Math.round(stats?.totalKwh || 0)}</p>
              <p className="text-xs text-muted-foreground">kWh Used</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-2">
                <Leaf className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{((stats?.co2Saved || 0) / 1000).toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Tons CO₂</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center mx-auto mb-2">
                <MapPin className="h-5 w-5 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{chargerStats.total}</p>
              <p className="text-xs text-muted-foreground">Chargers</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Personal Information */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  Personal Information
                </CardTitle>
                <Button 
                  variant={isEditing ? "default" : "ghost"} 
                  size="sm" 
                  className="gap-1.5 h-8" 
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  disabled={updateProfile.isPending}
                >
                  {isEditing ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      {updateProfile.isPending ? "Saving..." : "Save"}
                    </>
                  ) : (
                    <>
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-xs text-muted-foreground">First Name</Label>
                      <Input 
                        id="firstName" 
                        value={isEditing ? formData.firstName : (profile?.firstName || "")}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Enter first name"
                        className={isEditing ? "border-primary/50" : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-xs text-muted-foreground">Last Name</Label>
                      <Input 
                        id="lastName" 
                        value={isEditing ? formData.lastName : (profile?.lastName || "")}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Enter last name"
                        className={isEditing ? "border-primary/50" : ""}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs text-muted-foreground">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="email" 
                        value={profile?.email || ""} 
                        disabled
                        className="pl-10 bg-muted/50" 
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                  {isEditing && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          firstName: profile?.firstName || "",
                          lastName: profile?.lastName || "",
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Vehicle Section */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Car className="h-4 w-4 text-primary" />
                </div>
                My Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/80 to-muted/40 rounded-xl border border-border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Car className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Electric Vehicle</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs h-5">EV</Badge>
                      <Badge variant="outline" className="text-xs h-5">CCS2</Badge>
                      <Badge variant="outline" className="text-xs h-5">Type 2</Badge>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Preferences Section */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Settings className="h-4 w-4 text-primary" />
                </div>
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Theme Selection */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Appearance</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "light", icon: Sun, label: "Light" },
                    { value: "dark", icon: Moon, label: "Dark" },
                    { value: "system", icon: Monitor, label: "System" },
                  ].map(({ value, icon: Icon, label }) => (
                    <Button
                      key={value}
                      variant={theme === value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme(value)}
                      className="gap-2 h-9"
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Notifications */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">Notifications</Label>
                {[
                  { label: "Charging complete", description: "Get notified when done", enabled: true, icon: Zap },
                  { label: "Price alerts", description: "Low electricity rates", enabled: true, icon: Wallet },
                  { label: "Reminders", description: "Reservation reminders", enabled: false, icon: Bell },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-muted">
                        <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <Switch defaultChecked={item.enabled} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Links */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-2">
              {[
                { icon: CreditCard, label: "Payment Methods", badge: cardsLoading ? "..." : `${savedCards.length}`, href: "#" },
                { icon: Shield, label: "Privacy & Security", href: "#" },
                { icon: Bell, label: "Notification Settings", href: "#" },
              ].map(({ icon: Icon, label, badge, href }) => (
                <button
                  key={label}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted group-hover:bg-background transition-colors">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {badge && (
                      <Badge variant="secondary" className="text-xs">{badge}</Badge>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Sign Out */}
        <motion.div variants={itemVariants}>
          <Button 
            variant="outline" 
            className="w-full gap-2 h-11"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </motion.div>

        {/* Danger Zone */}
        <motion.div variants={itemVariants}>
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-destructive">Delete Account</p>
                  <p className="text-xs text-muted-foreground">Permanently remove your account</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/40"
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.main>
    </div>
  );
}
