import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/services/supabaseClient';

type AppRole = 'admin' | 'police' | 'tourist';

interface TouristProfile {
  id: string;
  user_id: string;
  tourist_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  emergency_contact: string | null;
  status: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  touristProfile: TouristProfile | null;
  userRole: AppRole | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata: { name: string; phone: string; emergencyContact?: string }) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [touristProfile, setTouristProfile] = useState<TouristProfile | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTouristProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('tourists')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching tourist profile:', error);
      return null;
    }
    return data;
  };

  const fetchUserRole = async (userId: string): Promise<AppRole | null> => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
    return data?.role || null;
  };

  const refreshProfile = async () => {
    if (user) {
      const profile = await fetchTouristProfile(user.id);
      setTouristProfile(profile);
      const role = await fetchUserRole(user.id);
      setUserRole(role);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer profile fetching to avoid blocking auth state
          setTimeout(async () => {
            const profile = await fetchTouristProfile(session.user.id);
            setTouristProfile(profile);
            const role = await fetchUserRole(session.user.id);
            setUserRole(role);
          }, 0);
        } else {
          setTouristProfile(null);
          setUserRole(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchTouristProfile(session.user.id).then(setTouristProfile);
        fetchUserRole(session.user.id).then(setUserRole);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    metadata: { name: string; phone: string; emergencyContact?: string }
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: metadata.name,
          },
        },
      });

      if (error) throw error;

      // If user is created, create the tourist profile
      if (data.user) {
        const touristId = generateTouristId();
        
        const { error: profileError } = await supabase
          .from('tourists')
          .insert({
            user_id: data.user.id,
            tourist_id: touristId,
            full_name: metadata.name,
            email: email,
            phone: metadata.phone || null,
            emergency_contact: metadata.emergencyContact || null,
            status: 'safe',
          });

        if (profileError) {
          console.error('Error creating tourist profile:', profileError);
          throw profileError;
        }

        // Assign tourist role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: 'tourist',
          });

        if (roleError) {
          console.error('Error assigning tourist role:', roleError);
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setTouristProfile(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        touristProfile,
        userRole,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
