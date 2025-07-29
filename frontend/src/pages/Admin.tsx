import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { plantConfigs } from "@/data/plantConfigs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

interface Profile {
  is_admin: boolean;
}

interface SystemControl {
  id: string;
  plant_id: string;
  component_id: string;
  is_enabled: boolean;
}

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [systemControls, setSystemControls] = useState<SystemControl[]>([]);
  const [loading, setLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null); // controlId being toggled
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            checkAdminStatus(session.user.id);
            fetchSystemControls();
          }, 0);
        }
      }
    );
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
        fetchSystemControls();
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', userId)
        .single();
      if (error) throw error;
      setIsAdmin(data?.is_admin || false);
    } catch (error) {
      setIsAdmin(false);
    }
  };

  const fetchSystemControls = async () => {
    try {
      const { data, error } = await supabase
        .from('system_controls')
        .select('*')
        .order('plant_id, component_id');
      if (error) throw error;
      setSystemControls(data || []);
      setLastUpdate(new Date().toLocaleString());
    } catch (error) {
      setAlert({ type: "error", message: "Failed to fetch system controls" });
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      setAlert({ type: "success", message: "Signed in successfully" });
    } catch (error: any) {
      setAlert({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
      toast({ title: "Success", description: "Signed out successfully" });
    } catch (error: any) {
      setAlert({ type: "error", message: error.message });
    }
  };

  const toggleSystemControl = async (controlId: string, newState: boolean) => {
    setToggleLoading(controlId);
    setAlert(null);
    try {
      const { error } = await supabase
        .from('system_controls')
        .update({ 
          is_enabled: newState,
          updated_by: user?.id 
        })
        .eq('id', controlId);
      if (error) throw error;
      setSystemControls(prev => 
        prev.map(control => 
          control.id === controlId 
            ? { ...control, is_enabled: newState }
            : control
        )
      );
      setAlert({ type: "success", message: `System control ${newState ? 'enabled' : 'disabled'}` });
      setLastUpdate(new Date().toLocaleString());
    } catch (error: any) {
      setAlert({ type: "error", message: error.message });
    } finally {
      setToggleLoading(null);
    }
  };

  // --- UI Helper: Get summary stats ---
  const getSummary = () => {
    const total = systemControls.length;
    const enabled = systemControls.filter(c => c.is_enabled).length;
    const disabled = total - enabled;
    return { total, enabled, disabled };
  };

  // --- UI Helper: Get badge color for status ---
  const getStatusBadge = (enabled: boolean) =>
    enabled ? <Badge variant="default">Enabled</Badge> : <Badge variant="destructive">Disabled</Badge>;

  // --- UI Helper: Get badge for component type (pump, valve, etc.) ---
  const getTypeBadge = (componentId: string) => {
    if (componentId.toLowerCase().includes("pump")) return <Badge variant="secondary">Pump</Badge>;
    if (componentId.toLowerCase().includes("valve")) return <Badge variant="secondary">Valve</Badge>;
    if (componentId.toLowerCase().includes("reactor")) return <Badge variant="secondary">Reactor</Badge>;
    if (componentId.toLowerCase().includes("coolant")) return <Badge variant="secondary">Coolant</Badge>;
    if (componentId.toLowerCase().includes("gen")) return <Badge variant="secondary">Generator</Badge>;
    if (componentId.toLowerCase().includes("trans")) return <Badge variant="secondary">Transformer</Badge>;
    if (componentId.toLowerCase().includes("tank")) return <Badge variant="secondary">Tank</Badge>;
    if (componentId.toLowerCase().includes("containment")) return <Badge variant="secondary">Containment</Badge>;
    if (componentId.toLowerCase().includes("load")) return <Badge variant="secondary">Load</Badge>;
    return <Badge variant="outline">Other</Badge>;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">🔐 Admin Access</CardTitle>
            <CardDescription className="text-center">
              Sign in to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alert && (
              <Alert variant={alert.type === "error" ? "destructive" : "default"} className="mb-4">
                <AlertTitle>{alert.type === "error" ? "Error" : "Info"}</AlertTitle>
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Button variant="ghost" onClick={() => navigate('/')}>Back to Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">⚠️ Access Denied</CardTitle>
            <CardDescription className="text-center">
              You don't have admin privileges
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">Contact your system administrator for access.</p>
            <div className="space-y-2">
              <Button onClick={handleSignOut} variant="outline" className="w-full">Sign Out</Button>
              <Button variant="ghost" onClick={() => navigate('/')}>Back to Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- MAIN ADMIN PANEL ---
  const summary = getSummary();
  return (
    <div className="min-h-screen bg-background">
      {/* Header Bar with Avatar and Status */}
      <header className="bg-card border-b border-border px-6 py-4 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔧</span>
            <h1 className="text-2xl font-bold text-primary">Admin Control Panel</h1>
            <Badge variant="secondary" className="ml-2">ICS Cyber Defense</Badge>
          </div>
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarFallback>{user.email?.[0]?.toUpperCase() || "A"}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground hidden md:inline">{user.email}</span>
            <Button variant="outline" onClick={() => navigate('/')}>Dashboard</Button>
            <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
          </div>
        </div>
      </header>

      {/* Summary/Status Bar */}
      <div className="bg-muted/40 border-b border-border px-6 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex items-center gap-4">
          <StatusSummary enabled={summary.enabled} disabled={summary.disabled} total={summary.total} />
          <span className="text-xs text-muted-foreground">Last update: {lastUpdate}</span>
        </div>
      </div>

      {/* Alert for errors/success */}
      {alert && (
        <div className="container max-w-2xl mx-auto mt-4">
          <Alert variant={alert.type === "error" ? "destructive" : "default"}>
            <AlertTitle>{alert.type === "error" ? "Error" : "Info"}</AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Controls: Accordion per Plant */}
      <main className="container mx-auto px-6 py-6 max-w-4xl">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">System Component Controls</h2>
          <p className="text-muted-foreground">Enable or disable individual system components across all industrial plants.</p>
        </div>
        <Accordion type="multiple" className="w-full space-y-4">
          {plantConfigs.map((plant) => {
            const plantControls = systemControls.filter(control => control.plant_id === plant.id);
            return (
              <AccordionItem value={plant.id} key={plant.id}>
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{plant.icon}</span>
                    <span className="font-semibold text-lg">{plant.name}</span>
                    <Badge variant="outline" className="ml-2">{plantControls.length} Components</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {plantControls.map((control) => (
                      <Card key={control.id} className="flex flex-col gap-2">
                        <CardHeader className="flex flex-row items-center gap-3 pb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Label className="font-medium text-base">{control.component_id.toUpperCase()}</Label>
                              {getTypeBadge(control.component_id)}
                              {getStatusBadge(control.is_enabled)}
                            </div>
                          </div>
                          {toggleLoading === control.id && <Progress value={100} className="w-16 h-2" />}
                        </CardHeader>
                        <CardContent className="flex items-center justify-between pt-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Switch
                                checked={control.is_enabled}
                                onCheckedChange={(checked) => toggleSystemControl(control.id, checked)}
                                disabled={!!toggleLoading}
                              />
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              {control.is_enabled ? "Turn OFF" : "Turn ON"} {control.component_id.toUpperCase()}
                            </TooltipContent>
                          </Tooltip>
                          <span className="text-xs text-muted-foreground ml-2">
                            {control.is_enabled ? "Enabled" : "Disabled"}
                          </span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </main>
    </div>
  );
};

// --- StatusSummary component for summary bar ---
function StatusSummary({ enabled, disabled, total }: { enabled: number; disabled: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant="default">Enabled: {enabled}</Badge>
      <Badge variant="destructive">Disabled: {disabled}</Badge>
      <Badge variant="outline">Total: {total}</Badge>
    </div>
  );
}

export default Admin;