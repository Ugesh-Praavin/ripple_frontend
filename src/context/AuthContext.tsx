import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { authAPI } from "../services/api";

export type UserRole = "ADMIN" | "SUPERVISOR" | null;

export type AuthContextState = {
  user: User | null;
  role: UserRole;
  block_id: string | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextState>({
  user: null,
  role: null,
  block_id: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactElement }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [block_id, setBlock_id] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log("[AuthProvider] Mount: subscribe auth state");
    const unsub = onAuthStateChanged(auth, async (u) => {
      console.log("[AuthProvider] onAuthStateChanged", !!u, u?.uid);
      setUser(u);

      if (u) {
        setLoading(true);
        try {
          // Fetch user info from /auth/me
          const userInfo = await authAPI.getMe();
          console.log("[AuthProvider] User info fetched", userInfo);
          setRole(userInfo.role);
          setBlock_id(userInfo.block_id || null);
        } catch (error) {
          console.error("[AuthProvider] Failed to fetch user info", error);
          // If API fails, logout user
          console.log("[AuthProvider] Logging out user due to API failure");
          await signOut(auth);
          setRole(null);
          setBlock_id(null);
        } finally {
          setLoading(false);
        }
      } else {
        setRole(null);
        setBlock_id(null);
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const value = useMemo<AuthContextState>(
    () => ({ user, role, block_id, loading }),
    [user, role, block_id, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
