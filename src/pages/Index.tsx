import { useNavigate } from 'react-router-dom';
import { Shield, UserPlus, LogIn, Users, MapPin, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: 'Real-time Safety Status',
      description: 'Stay informed about your safety status with instant updates and alerts.',
    },
    {
      icon: MapPin,
      title: 'Location Tracking',
      description: 'GPS-enabled tracking for enhanced security during your travels.',
    },
    {
      icon: Bell,
      title: 'Emergency Alerts',
      description: 'Instant notifications to authorities in case of emergencies.',
    },
    {
      icon: Users,
      title: 'Police Coordination',
      description: 'Direct connection with local law enforcement for rapid response.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="container mx-auto px-4 py-6 relative z-10">
          <nav className="flex items-center justify-between">
            <Logo variant="light" size="lg" />
            <Button
              variant="hero-outline"
              onClick={() => navigate('/police/login')}
              className="gap-2"
            >
              <Shield size={18} />
              Police Portal
            </Button>
          </nav>
        </div>

        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-primary-foreground">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in">
              Travel Safe, Travel Smart
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Your trusted companion for secure tourism. Register once, stay protected throughout your journey with real-time monitoring and instant emergency response.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Button
                variant="hero"
                size="xl"
                onClick={() => navigate('/signup')}
                className="gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <UserPlus size={20} />
                Register as Tourist
              </Button>
              <Button
                variant="hero-outline"
                size="xl"
                onClick={() => navigate('/signin')}
                className="gap-2"
              >
                <LogIn size={20} />
                Sign In
              </Button>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(220 25% 97%)" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Comprehensive Safety Features
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our smart tourism safety system provides end-to-end protection for travelers with cutting-edge technology.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group p-6 rounded-xl bg-card shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <feature.icon className="text-accent" size={24} />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
            Ready to Travel Safely?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of tourists who trust SafeTravel for their security needs.
          </p>
          <Button
            variant="hero"
            size="lg"
            onClick={() => navigate('/signup')}
            className="gap-2"
          >
            <UserPlus size={18} />
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo variant="light" size="sm" />
            <p className="text-sm opacity-70">
              © 2024 SafeTravel. Smart Tourism Safety System.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
