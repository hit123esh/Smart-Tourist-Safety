import { useState, useEffect } from 'react';
import { LogOut, Users, Search, Filter, RefreshCw, Shield, ChevronDown, Loader2, MapPin, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Logo from '@/components/Logo';
import StatusBadge from '@/components/StatusBadge';
import SimulationMap from '@/components/SimulationMap';
import AdminControlPanel from '@/components/AdminControlPanel';
import AlertsPanel from '@/components/AlertsPanel';
import ZoneTrackingTable from '@/components/ZoneTrackingTable';
import { useAuth } from '@/contexts/AuthContext';
import { useSimulation } from '@/contexts/SimulationContext';
import { supabase } from '@/services/supabaseClient';

interface Tourist {
  id: string;
  tourist_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: 'safe' | 'observation' | 'alert';
  created_at: string;
}

const PoliceDashboard = () => {
  const navigate = useNavigate();
  const { signOut, loading: authLoading } = useAuth();
  const { tourist: simulatedTourist, alerts } = useSimulation();
  const [tourists, setTourists] = useState<Tourist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchTourists = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('tourists')
      .select('id, tourist_id, full_name, email, phone, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tourists:', error);
    } else {
      setTourists(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTourists();
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const filteredTourists = tourists.filter((tourist) => {
    const matchesSearch =
      tourist.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tourist.tourist_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tourist.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || tourist.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: tourists.length,
    safe: tourists.filter((t) => t.status === 'safe').length,
    observation: tourists.filter((t) => t.status === 'observation').length,
    alert: tourists.filter((t) => t.status === 'alert').length,
  };

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged).length;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo variant="light" size="md" />
              <div className="hidden md:block h-6 w-px bg-primary-foreground/20" />
              <span className="hidden md:block text-sm font-medium text-primary-foreground/80">
                Police Control Center
              </span>
              {unacknowledgedAlerts > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 bg-destructive text-destructive-foreground rounded-full text-xs font-medium animate-pulse">
                  <Bell size={12} />
                  {unacknowledgedAlerts} Alert{unacknowledgedAlerts > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <Button
              variant="secondary"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                Police Dashboard
              </h1>
              <p className="text-muted-foreground">
                Monitor tourist safety zones and manage real-time tracking simulation.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                simulatedTourist.currentZone === 'safe' ? 'bg-status-safe-bg text-status-safe' :
                simulatedTourist.currentZone === 'caution' ? 'bg-status-observation-bg text-status-observation' :
                simulatedTourist.currentZone === 'danger' ? 'bg-status-alert-bg text-status-alert' :
                'bg-muted text-muted-foreground'
              }`}>
                <MapPin size={14} />
                Tourist: {simulatedTourist.currentZone.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Tabs for different views */}
          <Tabs defaultValue="simulation" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="simulation" className="gap-2">
                <MapPin size={16} />
                Live Simulation
              </TabsTrigger>
              <TabsTrigger value="registry" className="gap-2">
                <Users size={16} />
                Tourist Registry
              </TabsTrigger>
            </TabsList>

            {/* Simulation Tab */}
            <TabsContent value="simulation" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
                <Card className={simulatedTourist.currentZone === 'safe' ? 'ring-2 ring-status-safe' : ''}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-status-safe-bg flex items-center justify-center">
                        <Shield className="text-status-safe" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Safe Zones</p>
                        <p className="text-2xl font-bold text-foreground">3</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={simulatedTourist.currentZone === 'caution' ? 'ring-2 ring-status-observation' : ''}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-status-observation-bg flex items-center justify-center">
                        <Shield className="text-status-observation" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Caution Zones</p>
                        <p className="text-2xl font-bold text-foreground">2</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={simulatedTourist.currentZone === 'danger' ? 'ring-2 ring-status-alert' : ''}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-status-alert-bg flex items-center justify-center">
                        <Shield className="text-status-alert" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Danger Zones</p>
                        <p className="text-2xl font-bold text-foreground">2</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                        <Bell className="text-destructive" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Active Alerts</p>
                        <p className="text-2xl font-bold text-foreground">{unacknowledgedAlerts}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Simulation Area */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Map - Takes 2/3 on large screens */}
                <div className="lg:col-span-2">
                  <SimulationMap height="500px" allowClickToMove />
                </div>

                {/* Control Panel - Takes 1/3 on large screens */}
                <div className="space-y-6">
                  <AdminControlPanel />
                </div>
              </div>

              {/* Alerts and Tracking */}
              <div className="grid lg:grid-cols-2 gap-6">
                <AlertsPanel />
                <ZoneTrackingTable />
              </div>
            </TabsContent>

            {/* Registry Tab */}
            <TabsContent value="registry" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Users className="text-accent" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Tourists</p>
                        <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-status-safe-bg flex items-center justify-center">
                        <Shield className="text-status-safe" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Safe</p>
                        <p className="text-2xl font-bold text-foreground">{stats.safe}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-status-observation-bg flex items-center justify-center">
                        <Shield className="text-status-observation" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Under Observation</p>
                        <p className="text-2xl font-bold text-foreground">{stats.observation}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-status-alert-bg flex items-center justify-center">
                        <Shield className="text-status-alert" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Alerts</p>
                        <p className="text-2xl font-bold text-foreground">{stats.alert}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tourist Table */}
              <Card className="animate-slide-up">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle>Registered Tourists</CardTitle>
                      <CardDescription>
                        View all tourists registered in the safety system
                      </CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button variant="outline" className="gap-2 w-fit" onClick={fetchTourists} disabled={isLoading}>
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                        Refresh
                      </Button>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input
                          placeholder="Search by name, ID, or email..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 w-full sm:w-64"
                        />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="gap-2">
                            <Filter size={18} />
                            Status
                            <ChevronDown size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                            All Statuses
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFilter('safe')}>
                            Safe
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFilter('observation')}>
                            Under Observation
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFilter('alert')}>
                            Alert
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      <div className="rounded-lg border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="font-semibold">Tourist ID</TableHead>
                              <TableHead className="font-semibold">Name</TableHead>
                              <TableHead className="font-semibold hidden md:table-cell">Email</TableHead>
                              <TableHead className="font-semibold hidden lg:table-cell">Phone</TableHead>
                              <TableHead className="font-semibold">Status</TableHead>
                              <TableHead className="font-semibold hidden sm:table-cell">Registered</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredTourists.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                  {tourists.length === 0 
                                    ? 'No tourists registered yet.'
                                    : 'No tourists found matching your criteria.'}
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredTourists.map((tourist) => (
                                <TableRow key={tourist.id} className="hover:bg-muted/30">
                                  <TableCell className="font-mono text-sm font-medium">
                                    {tourist.tourist_id}
                                  </TableCell>
                                  <TableCell className="font-medium">{tourist.full_name}</TableCell>
                                  <TableCell className="hidden md:table-cell text-muted-foreground">
                                    {tourist.email}
                                  </TableCell>
                                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                                    {tourist.phone || '-'}
                                  </TableCell>
                                  <TableCell>
                                    <StatusBadge status={tourist.status} size="sm" />
                                  </TableCell>
                                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                                    {new Date(tourist.created_at).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="mt-4 text-sm text-muted-foreground">
                        Showing {filteredTourists.length} of {tourists.length} tourists
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default PoliceDashboard;
