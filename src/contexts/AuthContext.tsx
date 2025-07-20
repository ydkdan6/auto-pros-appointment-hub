import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone?: string;
  role: 'customer' | 'admin' | 'technician';
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthUser extends User {
  profile?: Profile;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  profile: Profile | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'customer' | 'technician';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile asynchronously
          setTimeout(async () => {
            const userProfile = await fetchProfile(session.user.id);
            setProfile(userProfile);
            if (userProfile) {
              setUser(prev => prev ? { ...prev, profile: userProfile } : null);
            }
          }, 0);
        } else {
          setProfile(null);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id).then(userProfile => {
          setProfile(userProfile);
          if (userProfile) {
            setUser(prev => prev ? { ...prev, profile: userProfile } : null);
          }
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      // Check if user has a profile and is approved (for technicians)
      if (data.user) {
        const userProfile = await fetchProfile(data.user.id);
        if (userProfile) {
          if (userProfile.role === 'technician' && !userProfile.is_approved) {
            await supabase.auth.signOut();
            setIsLoading(false);
            return { success: false, error: 'Your technician account is pending admin approval.' };
          }
        }
      }

      setIsLoading(false);
      return { success: true };
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: data.name,
            role: data.role,
          }
        }
      });

      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      if (authData.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            full_name: data.name,
            phone: data.phone,
            role: data.role,
            is_approved: data.role === 'customer' // Customers auto-approved, technicians need approval
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }

      setIsLoading(false);
      
      if (data.role === 'technician') {
        return { 
          success: true, 
          error: 'Registration successful! Your technician account is pending admin approval. You will be notified when approved.' 
        };
      }
      
      return { success: true };
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};