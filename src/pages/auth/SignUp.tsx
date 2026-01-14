import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Phone, User, Users, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/Logo';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const SignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    emergencyContact: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: 'Required fields missing',
        description: 'Please provide your name and email.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(formData.email, {
      name: formData.name,
      phone: formData.phone,
      emergencyContact: formData.emergencyContact || undefined,
    });

    if (error) {
      toast({
        title: 'Registration Failed',
        description: error.message,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: 'Account Created!',
      description: 'You can now sign in with your email.',
    });
    
    setIsLoading(false);
    navigate('/signin');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 md:p-6">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </Link>
          <Logo size="sm" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl animate-scale-in">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <UserPlus className="text-accent" size={32} />
            </div>
            <CardTitle className="font-display text-2xl">Create Your Account</CardTitle>
            <CardDescription>
              Register as a tourist to access safety features
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact (Optional)</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="emergencyContact"
                    name="emergencyContact"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Create Account
                  </>
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{' '}
              <Link to="/signin" className="text-accent hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SignUp;
