// src/context/SupabaseAuthContext.jsx
//
// Parallel to AuthContext.jsx during migration — same exposed shape
// (user, userRole, login, logout, loading, roleLoading) so swapping the
// provider in App.jsx later is a one-line change, not a rewrite.
//
// Fixed relative to the Firebase version, per the audit in MIGRATION.md:
//   1. No debug console.log of uid/email/role on every auth change.
//   2. Role-fetch failure is surfaced as `roleError`, not silently
//      defaulted to "subscriber" — a real Supabase outage during rollout
//      shouldn't look identical to "this user really is a subscriber."
//   3. login() now throws on invalid credentials — signInWithPassword
//      returns { data, error } rather than rejecting, so callers written
//      against the Firebase version (which does throw) would otherwise
//      silently "succeed" on a wrong password. AdminLogin.jsx's try/catch
//      depends on this throwing.

import { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { supabase } from "../supabaseClient";

const SupabaseAuthContext = createContext(null);

export function SupabaseAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [roleError, setRoleError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);

  async function fetchRole(userId) {
    setRoleLoading(true);
    setRoleError(null);
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) {
      // Missing profile row (PGRST116 = no rows) defaults to subscriber,
      // same as the Firestore behavior for a missing doc. Any other error
      // (network, RLS misconfig, etc.) is surfaced, not swallowed.
      if (error.code === "PGRST116") {
        setUserRole("subscriber");
      } else {
        setRoleError(error.message);
        setUserRole("subscriber"); // fail safe to lowest privilege, but visibly
      }
    } else {
      setUserRole(data.role);
    }
    setRoleLoading(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) {
        fetchRole(sessionUser.id);
      } else {
        setUserRole(null);
        setRoleLoading(false);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) {
        fetchRole(sessionUser.id);
      } else {
        setUserRole(null);
        setRoleError(null);
        setRoleLoading(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = () => supabase.auth.signOut();

  return (
    <SupabaseAuthContext.Provider
      value={{ user, userRole, roleError, login, logout, loading, roleLoading }}
    >
      {children}
    </SupabaseAuthContext.Provider>
  );
}

SupabaseAuthProvider.propTypes = { children: PropTypes.node.isRequired };

export function useSupabaseAuth() {
  return useContext(SupabaseAuthContext);
}