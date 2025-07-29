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

interface Profile {
  is_admin: boolean;
}

interface SystemControl {
  id: string;
  plant_id: string;
  component_id: string;
  is_enabled: boolean;
}

interface AttackScenario {
  id: string;
  plant_id: string;
  scenario_id: string;
  scenario_name: string;
  is_active: boolean;
  executed_by?: string;
  executed_at?: string;
}

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [systemControls, setSystemControls] = useState<SystemControl[]>([]);
  const [attackScenarios, setAttackScenarios] = useState<AttackScenario[]>([]);
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
            fetchAttackScenarios();
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
        fetchAttackScenarios();
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

  const fetchAttackScenarios = async () => {
    try {
      const { data, error } = await supabase
        .from('attack_scenarios')
        .select('*')
        .order('plant_id, scenario_id');

      if (error) throw error;
      setAttackScenarios(data || []);
    } catch (error) {
      console.error('Error fetching attack scenarios:', error);
      toast({
        title: "Error",
        description: "Failed to fetch attack scenarios",
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

  const emergencyShutdown = async (plantId: string) => {
    try {
      const { error } = await supabase
        .from('system_controls')
        .update({ 
          is_enabled: false,
          updated_by: user?.id 
        })
        .eq('plant_id', plantId);

      if (error) throw error;

      setSystemControls(prev => 
        prev.map(control => 
          control.plant_id === plantId
            ? { ...control, is_enabled: false }
            : control
        )
      );

      toast({
        title: "EMERGENCY SHUTDOWN",
        description: `All systems for ${getPlantName(plantId)} have been disabled`,
        variant: "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const activateAllSystems = async (plantId: string) => {
    try {
      const { error } = await supabase
        .from('system_controls')
        .update({ 
          is_enabled: true,
          updated_by: user?.id 
        })
        .eq('plant_id', plantId);

      if (error) throw error;

      setSystemControls(prev => 
        prev.map(control => 
          control.plant_id === plantId
            ? { ...control, is_enabled: true }
            : control
        )
      );

      toast({
        title: "Systems Activated",
        description: `All systems for ${getPlantName(plantId)} have been enabled`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const executeAttackScenario = async (scenarioId: string, plantId: string, scenarioName: string) => {
    try {
      const { error } = await supabase
        .from('attack_scenarios')
        .update({ 
          is_active: true,
          executed_by: user?.id,
          executed_at: new Date().toISOString()
        })
        .eq('id', scenarioId);

      if (error) throw error;

      setAttackScenarios(prev => 
        prev.map(scenario => 
          scenario.id === scenarioId 
            ? { ...scenario, is_active: true, executed_by: user?.id, executed_at: new Date().toISOString() }
            : scenario
        )
      );

      toast({
        title: "🚨 ATTACK SCENARIO EXECUTED",
        description: `${scenarioName} has been activated for ${getPlantName(plantId)}`,
        variant: "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const stopAttackScenario = async (scenarioId: string, plantId: string, scenarioName: string) => {
    try {
      const { error } = await supabase
        .from('attack_scenarios')
        .update({ 
          is_active: false,
          executed_by: null,
          executed_at: null
        })
        .eq('id', scenarioId);

      if (error) throw error;

      setAttackScenarios(prev => 
        prev.map(scenario => 
          scenario.id === scenarioId 
            ? { ...scenario, is_active: false, executed_by: undefined, executed_at: undefined }
            : scenario
        )
      );

      toast({
        title: "Attack Scenario Stopped",
        description: `${scenarioName} has been deactivated for ${getPlantName(plantId)}`,
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
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">Demo Credentials:</div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                Email: admin@hacksky.com<br/>
                Password: admin123
              </div>
            </div>
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
          <h2 className="text-xl font-semibold mb-2">Industrial Control System Admin Panel</h2>
          <p className="text-muted-foreground">
            Manage and monitor all industrial facility components. Exercise caution when making changes.
          </p>
        </div>

        <div className="grid gap-6">
          {plantConfigs.map((plant) => {
            const plantControls = systemControls.filter(control => control.plant_id === plant.id);
            const enabledControls = plantControls.filter(control => control.is_enabled).length;
            const totalControls = plantControls.length;
            
            return (
              <Card key={plant.id} className="border-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-3">
                        <span className="text-2xl">{plant.icon}</span>
                        <div>
                          <div>{plant.name}</div>
                          <div className="text-sm font-normal text-muted-foreground mt-1">
                            {enabledControls}/{totalControls} systems active
                          </div>
                        </div>
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={enabledControls === totalControls ? "default" : "secondary"}>
                        {enabledControls === totalControls ? "🟢 All Systems Online" : 
                         enabledControls === 0 ? "🔴 All Systems Offline" : 
                         "🟡 Partial Operations"}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>
                    Control individual components and manage emergency procedures
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Emergency Controls */}
                  <div className="flex gap-2 pb-4 border-b">
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => emergencyShutdown(plant.id)}
                      className="flex-1"
                    >
                      🚨 Emergency Shutdown
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => activateAllSystems(plant.id)}
                      className="flex-1"
                    >
                      ⚡ Activate All Systems
                    </Button>
                  </div>

                  {/* Component Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plantControls.map((control) => {
                      const componentLabel = control.component_id.toUpperCase().replace(/([A-Z])/g, ' $1').trim();
                      const isReactor = control.component_id.toLowerCase().includes('reactor');
                      const isTurbine = control.component_id.toLowerCase().includes('gen');
                      const isCritical = isReactor || control.component_id.toLowerCase().includes('containment');
                      
                      return (
                        <div 
                          key={control.id} 
                          className={`flex items-center justify-between p-4 border rounded-lg ${
                            isCritical ? 'border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-900/10' : 
                            isTurbine ? 'border-blue-200 bg-blue-50 dark:border-blue-800/50 dark:bg-blue-900/10' :
                            'border-gray-200 bg-gray-50 dark:border-gray-800/50 dark:bg-gray-900/10'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Label className="font-medium">
                                {isReactor ? "⚛️" : isTurbine ? "⚡" : "⚙️"} {componentLabel}
                              </Label>
                              {isCritical && <Badge variant="destructive" className="text-xs">CRITICAL</Badge>}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className={`w-2 h-2 rounded-full ${control.is_enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <p className="text-sm text-muted-foreground">
                                {control.is_enabled ? "Online" : "Offline"}
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={control.is_enabled}
                            onCheckedChange={(checked) => 
                              toggleSystemControl(control.id, checked)
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Attack Scenarios Section */}
        <Card className="mt-6 border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">⚔️ Attack Scenario Simulation</CardTitle>
            <CardDescription>
              Execute controlled attack scenarios for testing defense mechanisms. Use with extreme caution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              {plantConfigs.map((plant) => {
                const plantScenarios = attackScenarios.filter(scenario => scenario.plant_id === plant.id);
                const activeScenarios = plantScenarios.filter(scenario => scenario.is_active).length;
                
                return (
                  <div key={plant.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{plant.icon}</span>
                        <h3 className="font-semibold">{plant.name}</h3>
                        {activeScenarios > 0 && (
                          <Badge variant="destructive" className="ml-2">
                            {activeScenarios} Active Attack{activeScenarios > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {plantScenarios.map((scenario) => (
                        <div 
                          key={scenario.id} 
                          className={`p-3 border rounded-lg ${
                            scenario.is_active 
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                              : 'border-gray-200 bg-gray-50 dark:bg-gray-900/20'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-sm">{scenario.scenario_name}</div>
                            <div className={`w-2 h-2 rounded-full ${
                              scenario.is_active ? 'bg-red-500 animate-pulse' : 'bg-gray-400'
                            }`}></div>
                          </div>
                          
                          <div className="text-xs text-muted-foreground mb-3">
                            Status: {scenario.is_active ? 'ACTIVE' : 'INACTIVE'}
                            {scenario.executed_at && (
                              <div>Executed: {new Date(scenario.executed_at).toLocaleString()}</div>
                            )}
                          </div>
                          
                          <div className="flex gap-1">
                            {scenario.is_active ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 text-xs"
                                onClick={() => stopAttackScenario(scenario.id, scenario.plant_id, scenario.scenario_name)}
                              >
                                🛑 Stop
                              </Button>
                            ) : (
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                className="flex-1 text-xs"
                                onClick={() => executeAttackScenario(scenario.id, scenario.plant_id, scenario.scenario_name)}
                              >
                                ⚔️ Execute
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* System Status Overview */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>🔍 System Status Overview</CardTitle>
            <CardDescription>Global system status across all facilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plantConfigs.map((plant) => {
                const plantControls = systemControls.filter(control => control.plant_id === plant.id);
                const enabledControls = plantControls.filter(control => control.is_enabled).length;
                const totalControls = plantControls.length;
                const percentage = totalControls > 0 ? Math.round((enabledControls / totalControls) * 100) : 0;
                
                return (
                  <div key={plant.id} className="text-center p-4 border rounded-lg">
                    <div className="text-2xl mb-2">{plant.icon}</div>
                    <div className="font-medium">{plant.name}</div>
                    <div className="text-2xl font-bold mt-2 mb-1">{percentage}%</div>
                    <div className="text-sm text-muted-foreground">
                      {enabledControls}/{totalControls} active
                    </div>
                    <div className={`w-full h-2 bg-gray-200 rounded-full mt-2`}>
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          percentage === 100 ? 'bg-green-500' : 
                          percentage === 0 ? 'bg-red-500' : 'bg-yellow-500'
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
      </main>
    </div>
  );
};

export default Admin;