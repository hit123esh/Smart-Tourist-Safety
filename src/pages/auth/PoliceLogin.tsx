import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/Logo';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const PoliceLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signInPolice, isAuthenticated, userRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Redirect if already logged in with police/admin role
  if (isAuthenticated && (userRole === 'police' || userRole === 'admin')) {
    navigate('/police/dashboard');
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signInPolice(formData.email, formData.password);

    if (error) {
      toast({
        title: 'Authentication Failed',
        description: error.message,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: 'Welcome, Officer',
      description: 'You have successfully authenticated.',
    });
    
    setIsLoading(false);
    navigate('/police/dashboard');
  };

  return (
    <div className="min-h-screen hero-gradient flex flex-col">
      {/* Header */}
      <header className="p-4 md:p-6">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors">
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </Link>
          <Logo variant="light" size="sm" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl animate-scale-in">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-4">
              <Shield className="text-primary-foreground" size={32} />
            </div>
            <CardTitle className="font-display text-2xl">Police Portal</CardTitle>
            <CardDescription>
              Authorized personnel access only
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Official Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="officer@police.gov"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="default"
                size="lg"
                className="w-full mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Shield size={18} />
                    Access Dashboard
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground text-center">
                This portal is restricted to authorized law enforcement personnel. Unauthorized access attempts will be logged.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PoliceLogin;
