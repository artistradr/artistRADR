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
//   4. onAuthStateChange no longer re-triggers roleLoading (and therefore
//      an AdminRoute/PostEditor remount) on TOKEN_REFRESHED events for a
//      user who's already signed in — e.g. when the tab regains focus
//      after being backgrounded, Supabase silently refreshes the access
//      token and fires this listener again. Previously that re-ran
//      fetchRole() unconditionally, which flips roleLoading back to true,
//      which makes AdminRoute swap the whole page out for a "Loading…"
//      screen and back — unmounting/remounting PostEditor and silently
//      wiping any unsaved contentEditable draft. Only SIGNED_IN for a
//      *new* user id, or SIGNED_OUT, now touches loading/roleLoading.

import { createContext, useContext, useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { supabase } from "../supabaseClient";

const SupabaseAuthContext = createContext(null);

export function SupabaseAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [roleError, setRoleError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);

  // Tracks which user id the role was last fetched for, so a
  // TOKEN_REFRESHED (or any event) for the *same* user can update the
  // user object without re-triggering the roleLoading gate.
  const roleFetchedForRef = useRef(null);

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
    roleFetchedForRef.current = userId;
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
    } = supabase.auth.onAuthStateChange((event, session) => {
      const sessionUser = session?.user ?? null;

      // Always keep the user/session object current — a token refresh
      // does carry a legitimately updated session even for the same user.
      setUser(sessionUser);

      if (!sessionUser) {
        setUserRole(null);
        setRoleError(null);
        setRoleLoading(false);
        roleFetchedForRef.current = null;
        setLoading(false);
        return;
      }

      // Only re-run the role fetch (and its loading gate) when this is
      // genuinely a different user than we last fetched for. A
      // TOKEN_REFRESHED for the same id — the common case when a
      // backgrounded tab regains focus — is a no-op here: the role we
      // already have is still correct, and skipping this avoids flipping
      // roleLoading back to true, which would unmount any page gated by
      // AdminRoute (e.g. PostEditor) and lose unsaved work.
      if (roleFetchedForRef.current !== sessionUser.id) {
        fetchRole(sessionUser.id);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = () => {
    roleFetchedForRef.current = null;
    return supabase.auth.signOut();
  };

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