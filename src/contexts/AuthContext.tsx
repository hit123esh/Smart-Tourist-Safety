import { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '@/services/supabaseClient';

type AppRole = 'admin' | 'police' | 'tourist';

interface TouristProfile {
  id: string;
  tourist_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  emergency_contact: string | null;
  status: string;
  created_at: string;
}

interface AuthContextType {
  touristProfile: TouristProfile | null;
  userRole: AppRole | null;
  isAuthenticated: boolean;
  loading: boolean;
  signUp: (email: string, metadata: { name: string; phone: string; emergencyContact?: string }) => Promise<{ error: Error | null }>;
  signIn: (email: string) => Promise<{ error: Error | null; profile?: TouristProfile }>;
  signInPolice: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => void;
  setTouristProfile: (profile: TouristProfile | null) => void;
  setUserRole: (role: AppRole | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Generate a unique tourist ID
const generateTouristId = (): string => {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TST-${year}-${randomPart}`;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [touristProfile, setTouristProfile] = useState<TouristProfile | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  const signUp = async (
    email: string,
    metadata: { name: string; phone: string; emergencyContact?: string }
  ) => {
    try {
      setLoading(true);
      
      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('tourists')
        .select('email')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (existingUser) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }

      const touristId = generateTouristId();
      
      // Create tourist profile directly (no Supabase Auth)
      const { data, error: profileError } = await supabase
        .from('tourists')
        .insert({
          tourist_id: touristId,
          full_name: metadata.name.trim(),
          email: email.toLowerCase().trim(),
          phone: metadata.phone || null,
          emergency_contact: metadata.emergencyContact || null,
          status: 'safe',
        })
        .select()
        .single();

      if (profileError) {
        console.error('Error creating tourist profile:', profileError);
        throw profileError;
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string) => {
    try {
      setLoading(true);
      
      // Check if email exists in tourists table
      const { data: profile, error } = await supabase
        .from('tourists')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!profile) {
        throw new Error('User not registered. Please sign up first.');
      }

      // Set session state
      setTouristProfile(profile);
      setUserRole('tourist');
      setIsAuthenticated(true);

      return { error: null, profile };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const signInPolice = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Police still uses Supabase Auth for security
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Verify police/admin role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (!roleData || (roleData.role !== 'police' && roleData.role !== 'admin')) {
          await supabase.auth.signOut();
          throw new Error('You are not authorized to access the police portal.');
        }

        setUserRole(roleData.role as AppRole);
        setIsAuthenticated(true);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    // Sign out from Supabase Auth if police user
    await supabase.auth.signOut();
    
    // Clear client-side session
    setTouristProfile(null);
    setUserRole(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        touristProfile,
        userRole,
        isAuthenticated,
        loading,
        signUp,
        signIn,
        signInPolice,
        signOut,
        setTouristProfile,
        setUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
