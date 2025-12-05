import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';

export const login = async (email: string, password: string, role: UserRole): Promise<{ user: User | null; error: string | null }> => {
  try {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      // If sign in fails, try to sign up
      if (signInError.message.includes("Invalid login credentials")) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split('@')[0],
              role: role
            }
          }
        });

        if (signUpError) {
          return { user: null, error: signUpError.message };
        }

        if (signUpData.user) {
          // Check if session exists. If not, email confirmation is likely required.
          if (!signUpData.session) {
            return { user: null, error: "Account created! Please check your email to confirm your account." };
          }

          // Create profile record
          // Default is_approved is FALSE (db default).
          // Auto-approve the specific admin email to prevent lockout.
          const isAdminEmail = email === 'skiespink55@gmail.com';

          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: signUpData.user.id,
              full_name: email.split('@')[0],
              role: isAdminEmail ? UserRole.ADMIN : role,
              is_approved: isAdminEmail,
              is_banned: false
            });

          if (profileError) console.error('Error creating profile:', profileError);

          // Force sign out because they are not approved yet
          await supabase.auth.signOut();
          return { user: null, error: "Registration successful! Your account is pending approval by an administrator." };
        }
      } else {
        return { user: null, error: signInError.message };
      }
    }

    if (signInData.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signInData.user.id)
        .single();

      if (profile) {
        if (profile.is_banned) {
          await supabase.auth.signOut();
          return { user: null, error: "Account suspended." };
        }

        if (profile.is_approved === false) {
          await supabase.auth.signOut();
          return { user: null, error: "Account awaiting admin approval." };
        }

        return {
          user: {
            id: signInData.user.id,
            email: signInData.user.email,
            full_name: profile.full_name || signInData.user.email?.split('@')[0],
            role: profile.role as UserRole || role,
            is_approved: profile.is_approved,
            is_banned: profile.is_banned
          },
          error: null
        };
      }
    }

    return { user: null, error: "Unknown login error" };
  } catch (error: any) {
    console.error('Login error:', error);
    return { user: null, error: error.message || "An unexpected error occurred" };
  }
};

export const logout = async (): Promise<void> => {
  await supabase.auth.signOut();
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return {
    id: session.user.id,
    email: session.user.email,
    full_name: profile?.full_name || session.user.email?.split('@')[0],
    role: profile?.role as UserRole || UserRole.CONTRIBUTOR,
    is_approved: profile?.is_approved,
    is_banned: profile?.is_banned
  };
};

export const loginAnonymously = async (): Promise<{ user: User | null; error: string | null }> => {
  return { user: null, error: "Guest access is disabled." };
  /*
  try {
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      return { user: null, error: error.message };
    }

    if (data.user) {
      // Create a profile for the anonymous user
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          full_name: 'Guest User',
          role: UserRole.CONTRIBUTOR
        });

      if (profileError) console.error('Error creating guest profile:', profileError);

      return {
        user: {
          id: data.user.id,
          email: 'guest@anonymous',
          full_name: 'Guest User',
          role: UserRole.CONTRIBUTOR
        },
        error: null
      };
    }

    return { user: null, error: "Unknown error during guest login" };
  } catch (error: any) {
    console.error('Guest login error:', error);
    return { user: null, error: error.message };
  }
  */
};
