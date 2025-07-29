import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { plantConfigs } from "@/data/plantConfigs";

interface SystemControl {
  id: string;
  plant_id: string;
  component_id: string;
  is_enabled: boolean;
}

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [systemControls, setSystemControls] = useState<SystemControl[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('Found existing session for user:', session.user.email);
          setUser(session.user);
          setIsAdmin(true); // For demo purposes, assume admin
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (session?.user) {
          setUser(session.user);
          setIsAdmin(true); // For demo purposes, assume admin
        } else {
          setUser(null);
          setIsAdmin(false);
          setSystemControls([]);
        }
      }
    );

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  // Fetch system controls when admin status is confirmed
  useEffect(() => {
    if (isAdmin && systemControls.length === 0) {
      fetchSystemControls();
    }
  }, [isAdmin, systemControls.length]);

  const fetchSystemControls = async () => {
    try {
      console.log('Fetching system controls...');
      
      // Create demo controls for immediate use
      const demoControls: SystemControl[] = [
        // Water plant controls
        { id: '1', plant_id: 'water', component_id: 'pump1', is_enabled: true },
        { id: '2', plant_id: 'water', component_id: 'pump2', is_enabled: true },
        { id: '3', plant_id: 'water', component_id: 'backup_pump', is_enabled: true },
        { id: '4', plant_id: 'water', component_id: 'valveA', is_enabled: true },
        { id: '5', plant_id: 'water', component_id: 'valveB', is_enabled: true },
        { id: '6', plant_id: 'water', component_id: 'tank', is_enabled: true },
        { id: '7', plant_id: 'water', component_id: 'filtration', is_enabled: true },
        { id: '8', plant_id: 'water', component_id: 'monitoring', is_enabled: true },
        // Nuclear plant controls
        { id: '9', plant_id: 'nuclear', component_id: 'reactor1', is_enabled: true },
        { id: '10', plant_id: 'nuclear', component_id: 'reactor2', is_enabled: true },
        { id: '11', plant_id: 'nuclear', component_id: 'turbine1', is_enabled: true },
        { id: '12', plant_id: 'nuclear', component_id: 'turbine2', is_enabled: true },
        { id: '13', plant_id: 'nuclear', component_id: 'coolantA', is_enabled: true },
        { id: '14', plant_id: 'nuclear', component_id: 'coolantB', is_enabled: true },
        { id: '15', plant_id: 'nuclear', component_id: 'containment', is_enabled: true },
        // Grid controls
        { id: '16', plant_id: 'grid', component_id: 'gen1', is_enabled: true },
        { id: '17', plant_id: 'grid', component_id: 'gen2', is_enabled: true },
        { id: '18', plant_id: 'grid', component_id: 'transA', is_enabled: true },
        { id: '19', plant_id: 'grid', component_id: 'transB', is_enabled: true },
        { id: '20', plant_id: 'grid', component_id: 'substation1', is_enabled: true },
        { id: '21', plant_id: 'grid', component_id: 'substation2', is_enabled: true },
        { id: '22', plant_id: 'grid', component_id: 'protection_system', is_enabled: true },
        { id: '23', plant_id: 'grid', component_id: 'load', is_enabled: true },
      ];

      // Try to fetch from database first
      try {
        const { data, error } = await supabase
          .from('system_controls')
          .select('*')
          .order('plant_id, component_id');

        if (error) {
          console.log('Database fetch failed, using demo controls:', error.message);
          setSystemControls(demoControls);
        } else if (data && data.length > 0) {
          console.log('Using database controls:', data.length);
          setSystemControls(data);
        } else {
          console.log('No database controls found, using demo controls');
          setSystemControls(demoControls);
        }
      } catch (dbError) {
        console.log('Database error, using demo controls:', dbError);
        setSystemControls(demoControls);
      }
    } catch (error) {
      console.error('Error in fetchSystemControls:', error);
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
      console.log('Attempting to sign in with:', email);
      
      // Demo authentication - allow access with demo credentials
      if (email === 'admin@hacksky.com' && password === 'admin123') {
        console.log('Demo authentication successful');
        
        // Create a mock user session for demo purposes
        const mockUser = {
          id: 'demo-user-id',
          email: email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as User;
        
        setUser(mockUser);
        setIsAdmin(true);
        
        toast({
          title: "Success",
          description: "Demo authentication successful",
        });
        
        // Clear form
        setEmail("");
        setPassword("");
        return;
      }
      
      // Try real Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }

      console.log('Sign in successful:', data);
      toast({
        title: "Success",
        description: "Signed in successfully",
      });
    } catch (error: any) {
      console.error('Sign in failed:', error);
      toast({
        title: "Error",
        description: error.message || "Sign in failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      // For demo user, just clear local state
      if (user?.id === 'demo-user-id') {
        setUser(null);
        setIsAdmin(false);
        setSystemControls([]);
        navigate('/');
        toast({
          title: "Success",
          description: "Demo session ended",
        });
        return;
      }

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
        description: error.message || "Sign out failed",
        variant: "destructive",
      });
    }
  };

  const toggleSystemControl = async (controlId: string, newState: boolean) => {
    try {
      // For demo user, just update local state
      if (user?.id === 'demo-user-id') {
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
        return;
      }

      // Try to update in database
      try {
        const { error } = await supabase
          .from('system_controls')
          .update({ 
            is_enabled: newState,
            updated_by: user?.id 
          })
          .eq('id', controlId);

        if (error) {
          console.error('Database update failed:', error);
          // Fall back to local state update
          setSystemControls(prev => 
            prev.map(control => 
              control.id === controlId 
                ? { ...control, is_enabled: newState }
                : control
            )
          );
        } else {
          setSystemControls(prev => 
            prev.map(control => 
              control.id === controlId 
                ? { ...control, is_enabled: newState }
                : control
            )
          );
        }
      } catch (dbError) {
        console.error('Database error, using local update:', dbError);
        setSystemControls(prev => 
          prev.map(control => 
            control.id === controlId 
              ? { ...control, is_enabled: newState }
              : control
          )
        );
      }

      toast({
        title: "Success",
        description: `System control ${newState ? 'enabled' : 'disabled'}`,
      });
    } catch (error: any) {
      console.error('Error toggling system control:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update system control",
        variant: "destructive",
      });
    }
  };

  const emergencyShutdown = async (plantId: string) => {
    try {
      setSystemControls(prev => 
        prev.map(control => 
          control.plant_id === plantId
            ? { ...control, is_enabled: false }
            : control
        )
      );

      // Try to update in database
      try {
        const { error } = await supabase
          .from('system_controls')
          .update({ 
            is_enabled: false,
            updated_by: user?.id 
          })
          .eq('plant_id', plantId);

        if (error) {
          console.error('Database update failed:', error);
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
      }

      toast({
        title: "EMERGENCY SHUTDOWN",
        description: `All systems for ${getPlantName(plantId)} have been disabled`,
        variant: "destructive",
      });
    } catch (error: any) {
      console.error('Error in emergency shutdown:', error);
      toast({
        title: "Error",
        description: error.message || "Emergency shutdown failed",
        variant: "destructive",
      });
    }
  };

  const activateAllSystems = async (plantId: string) => {
    try {
      setSystemControls(prev => 
        prev.map(control => 
          control.plant_id === plantId
            ? { ...control, is_enabled: true }
            : control
        )
      );

      // Try to update in database
      try {
        const { error } = await supabase
          .from('system_controls')
          .update({ 
            is_enabled: true,
            updated_by: user?.id 
          })
          .eq('plant_id', plantId);

        if (error) {
          console.error('Database update failed:', error);
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
      }

      toast({
        title: "Systems Activated",
        description: `All systems for ${getPlantName(plantId)} have been enabled`,
      });
    } catch (error: any) {
      console.error('Error activating systems:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to activate systems",
        variant: "destructive",
      });
    }
  };

  const getPlantName = (plantId: string) => {
    const plant = plantConfigs.find(p => p.id === plantId);
    return plant?.name || plantId;
  };

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-2xl">
          <CardContent className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-300">Initializing admin panel...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <span className="text-3xl">🔐</span>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Admin Access
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300 text-base">
              Sign in to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSignIn} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-semibold">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  className="border-2 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-semibold">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="border-2 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300" 
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            
            <div className="text-center">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                className="text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                ← Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <span className="text-3xl">⚠️</span>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Access Denied
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300 text-base">
              You don't have admin privileges
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-slate-600 dark:text-slate-300 text-lg">
              Contact your system administrator for access.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={handleSignOut} 
                variant="outline" 
                className="w-full border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
              >
                Sign Out
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                className="w-full text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                ← Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <span className="text-3xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">🔧</span>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Admin Control Panel
            </span>
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
              Welcome, {user.email}
            </span>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6 max-w-6xl">
        <div className="mb-8 p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">Industrial Control System Admin Panel</h2>
          <p className="text-slate-600 dark:text-slate-300 text-lg">
            Manage and monitor all industrial facility components. Exercise caution when making changes.
          </p>
        </div>

        <div className="grid gap-8">
          {plantConfigs.map((plant) => {
            const plantControls = systemControls.filter(control => control.plant_id === plant.id);
            const enabledControls = plantControls.filter(control => control.is_enabled).length;
            const totalControls = plantControls.length;
            
            return (
              <Card key={plant.id} className="border-2 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-4 text-slate-800 dark:text-slate-100">
                        <span className="text-4xl p-3 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">{plant.icon}</span>
                        <div>
                          <div className="text-2xl font-bold">{plant.name}</div>
                          <div className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
                            {enabledControls}/{totalControls} systems active
                          </div>
                        </div>
                      </CardTitle>
                    </div>

                  </div>
                  <CardDescription className="text-slate-600 dark:text-slate-300 text-base">
                    Control individual components and manage emergency procedures
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Emergency Controls */}
                  <div className="flex gap-4 pb-6 border-b border-slate-200 dark:border-slate-700">
                    <Button 
                      variant="destructive" 
                      size="lg"
                      onClick={() => emergencyShutdown(plant.id)}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      🚨 Emergency Shutdown
                    </Button>
                    <Button 
                      variant="default" 
                      size="lg"
                      onClick={() => activateAllSystems(plant.id)}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      ⚡ Activate All Systems
                    </Button>
                  </div>

                  {/* Component Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plantControls.map((control) => {
                      const componentLabel = control.component_id.toUpperCase().replace(/([A-Z])/g, ' $1').trim().replace('_', ' ');
                      const isReactor = control.component_id.toLowerCase().includes('reactor');
                      const isTurbine = control.component_id.toLowerCase().includes('gen');
                      const isCritical = isReactor || control.component_id.toLowerCase().includes('containment');
                      
                      return (
                        <div 
                          key={control.id} 
                          className={`flex items-center justify-between p-4 border-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ${
                            isCritical 
                              ? 'border-red-300 bg-gradient-to-br from-red-50 to-red-100 dark:border-red-600 dark:bg-gradient-to-br dark:from-red-900/20 dark:to-red-800/20' : 
                            isTurbine 
                              ? 'border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100 dark:border-blue-600 dark:bg-gradient-to-br dark:from-blue-900/20 dark:to-blue-800/20' :
                              'border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100 dark:border-slate-600 dark:bg-gradient-to-br dark:from-slate-800/20 dark:to-slate-700/20'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-10 h-10 bg-white dark:bg-slate-700 rounded-lg shadow-md">
                                <span className="text-xl">
                                  {isReactor ? "⚛️" : isTurbine ? "⚡" : "⚙️"}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <Label className="font-bold text-slate-800 dark:text-slate-100 text-base tracking-wide">
                                  {componentLabel}
                                </Label>
                              </div>
                              {isCritical && (
                                <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-700 text-xs font-bold px-2 py-1 rounded-full">
                                  CRITICAL
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Switch
                              checked={control.is_enabled}
                              onCheckedChange={(checked) => 
                                toggleSystemControl(control.id, checked)
                              }
                              className={`scale-125 ${
                                control.is_enabled 
                                  ? 'data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500' 
                                  : 'data-[state=unchecked]:bg-red-500 data-[state=unchecked]:border-red-500'
                              }`}
                            />
                            <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              control.is_enabled 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            }`}>
                              {control.is_enabled ? 'ONLINE' : 'OFFLINE'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* System Status Overview */}
        <Card className="mt-8 border-2 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-t-lg">
            <CardTitle className="text-slate-800 dark:text-slate-100 text-xl font-bold flex items-center gap-3">
              <span className="text-2xl">🔍</span>
              System Status Overview
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300">
              Global system status across all facilities
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plantConfigs.map((plant) => {
                const plantControls = systemControls.filter(control => control.plant_id === plant.id);
                const enabledControls = plantControls.filter(control => control.is_enabled).length;
                const totalControls = plantControls.length;
                const percentage = totalControls > 0 ? Math.round((enabledControls / totalControls) * 100) : 0;
                
                return (
                  <div key={plant.id} className="text-center p-6 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="text-4xl mb-4 p-3 bg-white dark:bg-slate-700 rounded-full w-20 h-20 mx-auto flex items-center justify-center shadow-lg">
                      {plant.icon}
                    </div>
                    <div className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-2">{plant.name}</div>
                    <div className={`text-4xl font-bold mb-2 ${
                      percentage === 100 ? 'text-green-600 dark:text-green-400' : 
                      percentage === 0 ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {percentage}%
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300 font-medium mb-4">
                      {enabledControls}/{totalControls} active
                    </div>
                    <div className="w-full h-3 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 shadow-lg ${
                          percentage === 100 ? 'bg-gradient-to-r from-green-400 to-green-600' : 
                          percentage === 0 ? 'bg-gradient-to-r from-red-400 to-red-600' : 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Security Events Monitoring */}
        <Card className="mt-8 border-2 border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-t-lg">
            <CardTitle className="text-slate-800 dark:text-slate-100 text-xl font-bold flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              Security Events Monitoring
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300">
              Real-time security threat detection and analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Security Events Chart */}
              <div className="h-64 bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 border-b border-gray-200 dark:border-gray-600 pb-2">
                  Security Events Distribution
                </div>
                <div className="h-48 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-lg p-2">
                  <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📊</div>
                      <div className="text-sm font-semibold">Security Events Chart</div>
                      <div className="text-xs">Real-time threat analysis</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Alerts */}
              <div className="h-64 bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 border-b border-gray-200 dark:border-gray-600 pb-2">
                  Recent Security Alerts
                </div>
                <div className="h-48 overflow-y-auto space-y-2">
                  <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-800 dark:bg-red-950/20 dark:border-red-400 dark:text-red-300 rounded-lg">
                    <div className="font-semibold text-sm">Unauthorized Access Attempt</div>
                    <div className="text-xs">Source: 192.168.1.100 | Time: 14:32:15</div>
                  </div>
                  <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 dark:bg-yellow-950/20 dark:border-yellow-400 dark:text-yellow-300 rounded-lg">
                    <div className="font-semibold text-sm">Suspicious Login Pattern</div>
                    <div className="text-xs">User: admin@unknown | Time: 14:28:42</div>
                  </div>
                  <div className="p-3 bg-green-50 border-l-4 border-green-500 text-green-800 dark:bg-green-950/20 dark:border-green-400 dark:text-green-300 rounded-lg">
                    <div className="font-semibold text-sm">Threat Blocked Successfully</div>
                    <div className="text-xs">Malware signature detected | Time: 14:25:18</div>
                  </div>
                  <div className="p-3 bg-blue-50 border-l-4 border-blue-500 text-blue-800 dark:bg-blue-950/20 dark:border-blue-400 dark:text-blue-300 rounded-lg">
                    <div className="font-semibold text-sm">System Scan Complete</div>
                    <div className="text-xs">No vulnerabilities found | Time: 14:20:33</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Metrics */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">3</div>
                <div className="text-sm text-red-700 dark:text-red-300">Active Threats</div>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">12</div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300">Suspicious Events</div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">47</div>
                <div className="text-sm text-green-700 dark:text-green-300">Threats Blocked</div>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">99.8%</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Protection Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;