import { supabase } from './supabase';
import type { User, UserRole } from './datatypes';

export interface AdminAuthResult {
  user: User | null;
  error: string | null;
}

/**
 * Sign in with email and password, and verify that the user has the 'admin' role.
 * If the role is not 'admin', the user is immediately signed out and an error is returned.
 */
export async function signInAdmin(email: string, password: string): Promise<AdminAuthResult> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return { user: null, error: authError.message };
    }

    if (!authData.user) {
      return { user: null, error: 'Authentication failed. Please try again.' };
    }

    // Verify role in public.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError || !userData) {
      // Sign out immediately if profile is not found or error occurred
      await supabase.auth.signOut();
      return {
        user: null,
        error: 'User profile not found. Please contact support.',
      };
    }

    const typedUser = userData as User;

    if (typedUser.role !== 'admin') {
      // Sign out non-admin users
      await supabase.auth.signOut();
      return {
        user: null,
        error: 'Access denied. Only administrators are allowed to enter.',
      };
    }

    return { user: typedUser, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred during login.';
    return { user: null, error: message };
  }
}

/**
 * Get the currently authenticated user and verify admin role.
 */
export async function getCurrentAdminUser(): Promise<AdminAuthResult> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return { user: null, error: null };
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData) {
      return { user: null, error: 'User profile record not found.' };
    }

    const typedUser = userData as User;
    if (typedUser.role !== 'admin') {
      return { user: null, error: 'User does not have admin permissions.' };
    }

    return { user: typedUser, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve current user.';
    return { user: null, error: message };
  }
}

/**
 * Sign out the current session
 */
export async function signOut(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    return { error: error ? error.message : null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error signing out.';
    return { error: message };
  }
}
