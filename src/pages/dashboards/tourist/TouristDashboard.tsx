import { LogOut, MapPin, Bell, Phone, Settings, User, Loader2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Logo from '@/components/Logo';
import TouristIdCard from '@/components/TouristIdCard';
import SafetyHeatMap from '@/components/SafetyHeatMap';
import SafeHavenChatbot from '@/components/SafeHavenChatbot';
import { useAuth } from '@/contexts/AuthContext';
import { useSimulation } from '@/contexts/SimulationContext';
import { toast } from 'sonner';

const TouristDashboard = () => {
  const navigate = useNavigate();
  const { touristProfile, signOut, loading } = useAuth();
  const { triggerPanic, tourist } = useSimulation();
  const [showPanicConfirm, setShowPanicConfirm] = useState(false);
  const [panicSent, setPanicSent] = useState(false);

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  const handlePanicPress = () => {
    setShowPanicConfirm(true);
  };

  const confirmPanic = () => {
    triggerPanic();
    setPanicSent(true);
    setShowPanicConfirm(false);
    toast.error('PANIC ALERT SENT!', {
      description: 'Police have been notified of your location. Stay calm and stay put if possible.',
      duration: 10000,
    });
    // Reset after 30 seconds to allow sending again
    setTimeout(() => setPanicSent(false), 30000);
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

          {/* PANIC BUTTON */}
          <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <Card className={`border-2 ${panicSent ? 'border-status-alert bg-status-alert/10' : 'border-destructive/50 hover:border-destructive'} transition-all`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Button
                    size="lg"
                    variant="destructive"
                    className={`h-20 w-20 rounded-full text-lg font-bold shadow-lg ${
                      panicSent 
                        ? 'animate-pulse bg-status-alert cursor-not-allowed' 
                        : 'hover:scale-105 transition-transform'
                    }`}
                    onClick={handlePanicPress}
                    disabled={panicSent}
                  >
                    <AlertTriangle className="w-8 h-8" />
                  </Button>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-destructive mb-1">
                      {panicSent ? 'ALERT SENT!' : 'PANIC BUTTON'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {panicSent 
                        ? 'Police have been notified. Help is on the way.'
                        : 'Press in case of emergency. Police will be immediately notified with your location.'}
                    </p>
                    {panicSent && (
                      <p className="text-xs text-status-alert mt-2 font-medium">
                        Location: {tourist.position.lat.toFixed(4)}, {tourist.position.lng.toFixed(4)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-accent/10">
                      <action.icon className="text-accent" size={20} />
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

          {/* Safety Heat Map */}
          <div className="animate-slide-up" style={{ animationDelay: '0.25s' }}>
            <SafetyHeatMap height="400px" />
          </div>
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

      {/* RAG-Lite Chatbot */}
      <SafeHavenChatbot />

      {/* Panic Confirmation Dialog */}
      <AlertDialog open={showPanicConfirm} onOpenChange={setShowPanicConfirm}>
        <AlertDialogContent className="border-destructive">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Confirm Emergency Alert
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately send a high-priority alert to police with your current location. 
              Only use this in a genuine emergency.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-muted/50 p-3 rounded-lg text-sm">
            <p className="font-medium">Your current location will be shared:</p>
            <p className="font-mono text-xs mt-1">
              {tourist.position.lat.toFixed(6)}, {tourist.position.lng.toFixed(6)}
            </p>
            <p className="text-muted-foreground mt-1">
              Zone: {tourist.zoneName || 'Unknown'}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPanic}
              className="bg-destructive hover:bg-destructive/90"
            >
              SEND EMERGENCY ALERT
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TouristDashboard;
