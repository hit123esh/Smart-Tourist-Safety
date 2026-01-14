import { LogOut, MapPin, Bell, Phone, Settings, User, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/Logo';
import TouristIdCard from '@/components/TouristIdCard';
import { useAuth } from '@/contexts/AuthContext';

const TouristDashboard = () => {
  const navigate = useNavigate();
  const { touristProfile, signOut, loading } = useAuth();

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      icon: MapPin,
      title: 'Update Location',
      description: 'Share your current location',
      action: () => {},
      disabled: true,
    },
    {
      icon: Bell,
      title: 'Emergency Alert',
      description: 'Send SOS to authorities',
      action: () => {},
      variant: 'destructive' as const,
    },
    {
      icon: Phone,
      title: 'Contact Support',
      description: 'Get help 24/7',
      action: () => {},
    },
  ];

  const displayName = touristProfile?.full_name || 'Tourist';
  const firstName = displayName.split(' ')[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon">
                <Settings size={20} />
              </Button>
              <Button variant="outline" onClick={handleLogout} className="gap-2">
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="animate-fade-in">
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Welcome back, {firstName}!
            </h1>
            <p className="text-muted-foreground">
              Your safety is our priority. Here's your current status.
            </p>
          </div>

          {/* Tourist ID Card */}
          {touristProfile && (
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <TouristIdCard
                touristId={touristProfile.tourist_id}
                name={touristProfile.full_name}
                status={touristProfile.status as 'safe' | 'observation' | 'alert'}
              />
            </div>
          )}

          {/* Quick Actions */}
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">
              Quick Actions
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <Card
                  key={action.title}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                    action.disabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={action.disabled ? undefined : action.action}
                >
                  <CardContent className="p-5">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                        action.variant === 'destructive'
                          ? 'bg-destructive/10'
                          : 'bg-accent/10'
                      }`}
                    >
                      <action.icon
                        className={
                          action.variant === 'destructive'
                            ? 'text-destructive'
                            : 'text-accent'
                        }
                        size={20}
                      />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {action.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                    {action.disabled && (
                      <span className="text-xs text-muted-foreground mt-2 block">
                        Coming soon
                      </span>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Profile Info */}
          {touristProfile && (
            <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User size={20} />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Your registered details with the safety system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Email</p>
                      <p className="font-medium text-foreground">{touristProfile.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Phone</p>
                      <p className="font-medium text-foreground">{touristProfile.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Emergency Contact</p>
                      <p className="font-medium text-foreground">
                        {touristProfile.emergency_contact || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Registered On</p>
                      <p className="font-medium text-foreground">
                        {new Date(touristProfile.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TouristDashboard;
