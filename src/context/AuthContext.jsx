import { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setRoleLoading(true);
        try {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          console.log("=== RADR AUTH DEBUG ===");
          console.log("UID:", firebaseUser.uid);
          console.log("Email:", firebaseUser.email);
          console.log("Doc exists:", snap.exists());
          console.log("Doc data:", snap.data());
          const role = snap.exists() ? snap.data().role : "subscriber";
          console.log("Role set to:", role);
          setUserRole(role);
        } catch (err) {
          console.error("=== RADR AUTH ERROR ===", err.code, err.message);
          setUserRole("subscriber");
        }
        setRoleLoading(false);
      } else {
        console.log("=== RADR AUTH: No user signed in ===");
        setUser(null);
        setUserRole(null);
        setRoleLoading(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, userRole, login, logout, loading, roleLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = { children: PropTypes.node.isRequired };

export function useAuth() {
  return useContext(AuthContext);
}