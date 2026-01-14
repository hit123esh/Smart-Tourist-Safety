import { useState, useEffect } from 'react';
import { LogOut, Users, Search, Filter, RefreshCw, Shield, ChevronDown, Loader2 } from 'lucide-react';
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
import Logo from '@/components/Logo';
import StatusBadge from '@/components/StatusBadge';
import SafetyHeatMap from '@/components/SafetyHeatMap';
import { useAuth } from '@/contexts/AuthContext';
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
                Tourist Registry
              </h1>
              <p className="text-muted-foreground">
                Monitor and manage all registered tourists in the system.
              </p>
            </div>
            <Button variant="outline" className="gap-2 w-fit" onClick={fetchTourists} disabled={isLoading}>
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              Refresh Data
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
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

          {/* Safety Heat Map */}
          <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <SafetyHeatMap height="450px" />
          </div>

          {/* Tourist Table */}
          <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Registered Tourists</CardTitle>
                  <CardDescription>
                    View all tourists registered in the safety system
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
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
        </div>
      </main>
    </div>
  );
};

export default PoliceDashboard;
