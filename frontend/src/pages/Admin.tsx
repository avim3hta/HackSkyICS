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
      console.error('Error checking admin status:', error);
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
    } catch (error) {
      console.error('Error fetching system controls:', error);
      toast({
        title: "Error",
        description: "Failed to fetch system controls",
        variant: "destructive",
      });
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Signed in successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      navigate('/');
      toast({
        title: "Success",
        description: "Signed out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleSystemControl = async (controlId: string, newState: boolean) => {
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

      toast({
        title: "Success",
        description: `System control ${newState ? 'enabled' : 'disabled'}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getPlantName = (plantId: string) => {
    const plant = plantConfigs.find(p => p.id === plantId);
    return plant?.name || plantId;
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
              <Button variant="ghost" onClick={() => navigate('/')}>
                Back to Dashboard
              </Button>
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
            <p className="text-muted-foreground">
              Contact your system administrator for access.
            </p>
            <div className="space-y-2">
              <Button onClick={handleSignOut} variant="outline" className="w-full">
                Sign Out
              </Button>
              <Button variant="ghost" onClick={() => navigate('/')}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-3">
            <span className="text-3xl">🔧</span>
            Admin Control Panel
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user.email}
            </span>
            <Button variant="outline" onClick={() => navigate('/')}>
              Dashboard
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6 max-w-6xl">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">System Component Controls</h2>
          <p className="text-muted-foreground">
            Enable or disable individual system components across all industrial plants.
          </p>
        </div>

        <div className="grid gap-6">
          {plantConfigs.map((plant) => {
            const plantControls = systemControls.filter(control => control.plant_id === plant.id);
            
            return (
              <Card key={plant.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>{plant.icon}</span>
                    {plant.name}
                  </CardTitle>
                  <CardDescription>
                    Control individual components for this facility
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plantControls.map((control) => (
                      <div key={control.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label className="font-medium">
                            {control.component_id.toUpperCase()}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {control.is_enabled ? "Enabled" : "Disabled"}
                          </p>
                        </div>
                        <Switch
                          checked={control.is_enabled}
                          onCheckedChange={(checked) => 
                            toggleSystemControl(control.id, checked)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Admin;