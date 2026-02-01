import { useState, useEffect } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { BottomNav } from "@/components/layout/BottomNav";
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
  CreditCard, 
  Bell,
  Shield,
  ChevronRight,
  Edit2,
  Check,
  Sun,
  Moon,
  Monitor,
  Wallet,
  Settings,
  LogOut,
  Globe,
  Smartphone,
  MapPin,
  Clock,
  HelpCircle,
  FileText,
  MessageSquare
} from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useUserProfile, useUpdateProfile, useSavedCards } from "@/hooks/useUserProfile";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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
  const { data: savedCards = [], isLoading: cardsLoading } = useSavedCards();
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

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      
      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 md:p-6 pb-28 md:pb-6 space-y-5 max-w-2xl mx-auto"
      >
        {/* Profile Header Card */}
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-none shadow-lg">
            <div className="h-24 bg-gradient-to-br from-primary via-primary/80 to-primary-glow relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnYtMmgtNHYyaC0ydjJoMnY0aDJ2MmgtMnY0aDR2LTJoMnYtNGgtMnYtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
            </div>
            <CardContent className="pt-0 -mt-12 relative">
              {profileLoading ? (
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
                  </div>
                </div>
              )}
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

              {/* Language & Region */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">Language & Region</Label>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-muted">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Language</p>
                      <p className="text-xs text-muted-foreground">English (US)</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-muted">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Time Zone</p>
                      <p className="text-xs text-muted-foreground">Auto-detect</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Separator />

              {/* Notifications */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">Notifications</Label>
                {[
                  { label: "Charging complete", description: "Get notified when your session ends", enabled: true, icon: Bell },
                  { label: "Price alerts", description: "Notify when prices drop below average", enabled: true, icon: Wallet },
                  { label: "Reservation reminders", description: "15 min before your reservation", enabled: true, icon: Clock },
                  { label: "Promotional offers", description: "Discounts and special offers", enabled: false, icon: MessageSquare },
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

              <Separator />

              {/* Map & Location */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">Map & Location</Label>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-muted">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Location access</p>
                      <p className="text-xs text-muted-foreground">Show nearby chargers</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-muted">
                      <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Navigation app</p>
                      <p className="text-xs text-muted-foreground">Google Maps</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Links */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-2">
              {[
                { icon: CreditCard, label: "Payment Methods", badge: cardsLoading ? "..." : `${savedCards.length}` },
                { icon: Shield, label: "Privacy & Security" },
                { icon: FileText, label: "Terms of Service" },
                { icon: HelpCircle, label: "Help & Support" },
              ].map(({ icon: Icon, label, badge }) => (
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
      
      <BottomNav />
    </div>
  );
}