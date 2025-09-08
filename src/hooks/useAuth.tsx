
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import type { User, Session } from '@supabase/supabase-js';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST to prevent race conditions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out successfully",
        description: "You have been logged out.",
      });
      
      navigate('/');
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        title: "Sign out failed",
        description: error.message || "An error occurred while signing out.",
        variant: "destructive",
      });
    }
  };

  const requireAuth = () => {
    if (!user && !loading) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access this feature.",
        variant: "destructive",
      });
      navigate('/login');
      return false;
    }
    return true;
  };

  return {
    user,
    session,
    loading,
    signOut,
    requireAuth,
    isAuthenticated: !!user
  };
};
