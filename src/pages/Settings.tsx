import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Phone, Save, MessageCircle } from "lucide-react";
import { z } from "zod";

const phoneSchema = z.object({
  phone_number: z.string()
    .trim()
    .regex(/^\+[1-9]\d{1,14}$/, {
      message: "Phone must be in international format (e.g., +1234567890)"
    })
    .max(15, { message: "Phone number too long" })
});

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    checkAuth();
    fetchProfile();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUserEmail(session.user.email || "");
  };

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("phone_number, telegram_id")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error);
        return;
      }

      if (data?.phone_number) {
        setPhoneNumber(data.phone_number);
      }
      if (data?.telegram_id) {
        setTelegramId(data.telegram_id);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSave = async () => {
    try {
      // Validate phone number if provided
      if (phoneNumber) {
        const validation = phoneSchema.safeParse({ phone_number: phoneNumber });
        
        if (!validation.success) {
          toast({
            title: "Invalid Phone Number",
            description: validation.error.errors[0].message,
            variant: "destructive",
          });
          return;
        }
      }

      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const updateData: { phone_number?: string; telegram_id?: string } = {};
      if (phoneNumber) updateData.phone_number = phoneNumber;
      if (telegramId) updateData.telegram_id = telegramId;

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "✅ Settings Saved",
        description: "Your integration settings have been updated",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your account and messaging integration settings
            </p>
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your account details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input
                  value={userEmail}
                  disabled
                  className="bg-muted"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                WhatsApp Integration
              </CardTitle>
              <CardDescription>
                Add your WhatsApp phone number to enable chat integration via n8n
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  maxLength={15}
                />
                <p className="text-sm text-muted-foreground">
                  Enter your phone number in international format (e.g., +1 for USA, +44 for UK)
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm font-medium">Format Examples:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• USA: +1234567890</li>
                  <li>• UK: +441234567890</li>
                  <li>• India: +911234567890</li>
                </ul>
              </div>

              <Button
                onClick={handleSave}
                disabled={loading || !phoneNumber}
                className="w-full gap-2"
              >
                <Save className="h-4 w-4" />
                {loading ? "Saving..." : "Save Settings"}
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Telegram Integration
              </CardTitle>
              <CardDescription>
                Add your Telegram ID to enable chat integration via n8n
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="telegram">Telegram ID</Label>
                <Input
                  id="telegram"
                  type="text"
                  placeholder="Your Telegram user ID"
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Don't know your Telegram ID? Message your bot and it will show you.
                </p>
              </div>

              <Button
                onClick={handleSave}
                disabled={loading || (!phoneNumber && !telegramId)}
                className="w-full gap-2"
              >
                <Save className="h-4 w-4" />
                {loading ? "Saving..." : "Save Settings"}
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm">📱 Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <p>After adding your Telegram ID or phone number:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Set up n8n workflow with Telegram/WhatsApp</li>
                <li>Configure webhook to call the chat edge function</li>
                <li>Test by sending "reading list" to your bot</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
