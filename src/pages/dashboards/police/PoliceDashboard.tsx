import { useState } from 'react';
import { LogOut, Users, Search, Filter, RefreshCw, Shield, ChevronDown } from 'lucide-react';
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

// Mock data - will be replaced with Supabase data
const mockTourists = [
  {
    id: 'TST-2024-A7F3K9',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 234 567 8900',
    status: 'safe' as const,
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'TST-2024-B8G4L0',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1 234 567 8901',
    status: 'observation' as const,
    createdAt: '2024-01-14T14:22:00Z',
  },
  {
    id: 'TST-2024-C9H5M1',
    name: 'Robert Johnson',
    email: 'robert@example.com',
    phone: '+1 234 567 8902',
    status: 'safe' as const,
    createdAt: '2024-01-13T09:15:00Z',
  },
  {
    id: 'TST-2024-D0I6N2',
    name: 'Emily Brown',
    email: 'emily@example.com',
    phone: '+1 234 567 8903',
    status: 'safe' as const,
    createdAt: '2024-01-12T16:45:00Z',
  },
  {
    id: 'TST-2024-E1J7O3',
    name: 'Michael Wilson',
    email: 'michael@example.com',
    phone: '+1 234 567 8904',
    status: 'observation' as const,
    createdAt: '2024-01-11T11:30:00Z',
  },
];

const PoliceDashboard = () => {
  const navigate = useNavigate();
  const [tourists] = useState(mockTourists);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleLogout = () => {
    // TODO: Implement Supabase logout
    navigate('/');
  };

  const filteredTourists = tourists.filter((tourist) => {
    const matchesSearch =
      tourist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tourist.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tourist.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || tourist.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: tourists.length,
    safe: tourists.filter((t) => t.status === 'safe').length,
    observation: tourists.filter((t) => t.status === 'observation').length,
    alert: 0, // Placeholder for future alert status
  };

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
            <Button variant="outline" className="gap-2 w-fit">
              <RefreshCw size={18} />
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
                          No tourists found matching your criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTourists.map((tourist) => (
                        <TableRow key={tourist.id} className="hover:bg-muted/30">
                          <TableCell className="font-mono text-sm font-medium">
                            {tourist.id}
                          </TableCell>
                          <TableCell className="font-medium">{tourist.name}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            {tourist.email}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground">
                            {tourist.phone}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={tourist.status} size="sm" />
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">
                            {new Date(tourist.createdAt).toLocaleDateString('en-US', {
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
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PoliceDashboard;
