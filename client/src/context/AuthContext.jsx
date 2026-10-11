import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Who is logged in, their profile, and whether they are an admin.
// Supabase keeps the session in the browser, so it survives page reloads.
// NOTE: isAdmin only decides what the UI shows. The real protection is in the
// database (RLS + the admin checks inside every admin function).

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkedUserId, setCheckedUserId] = useState(null);   // whose profile/admin status is loaded

  const loadProfile = useCallback(async (user) => {
    if (!user) {
      setProfile(null);
      setIsAdmin(false);
      setCheckedUserId(null);
      return;
    }
    const [{ data: prof }, { data: admin }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, phone, role').eq('id', user.id).maybeSingle(),
      supabase.rpc('is_admin'),
    ]);
    setProfile(prof ?? null);
    setIsAdmin(admin === true);
    setCheckedUserId(user.id);
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadProfile(data.session?.user);
      if (active) setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      // Run outside the auth callback, as Supabase recommends
      setTimeout(() => loadProfile(newSession?.user), 0);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password });

  const signUp = (email, password, fullName) =>
    supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/account` } });

  const resetPassword = (email) =>
    supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/account` });

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setIsAdmin(false);
  };

  const updateProfile = async (changes) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(changes)                      // only full_name and phone are allowed by the database
      .eq('id', session.user.id)
      .select('id, full_name, phone, role')
      .single();
    if (!error) setProfile(data);
    return { error };
  };

  const user = session?.user ?? null;
  // ready = we know who is logged in AND their admin status (avoids a flash of "Not authorised")
  const ready = !loading && (!user || checkedUserId === user.id);

  return (
    <AuthContext.Provider value={{
      session, user, profile, isAdmin, loading, ready,
      signIn, signUp, signInWithGoogle, resetPassword, signOut, updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
