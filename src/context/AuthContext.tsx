import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { adminAPI, supervisorAPI } from "../services/api";
import type { AdminUser, SupervisorUser } from "../services/api";

export type UserRole = "ADMIN" | "SUPERVISOR" | null;

export type AuthContextState = {
  user: User | null;
  userInfo: AdminUser | SupervisorUser | null;
  role: UserRole;
  loading: boolean;
};

const AuthContext = createContext<AuthContextState>({
  user: null,
  userInfo: null,
  role: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactElement }) {
  const [user, setUser] = useState<User | null>(null);
  const [userInfo, setUserInfo] = useState<AdminUser | SupervisorUser | null>(
    null
  );
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log("[AuthProvider] Mount: subscribe auth state");
    const unsub = onAuthStateChanged(auth, async (u) => {
      console.log("[AuthProvider] onAuthStateChanged", !!u, u?.uid);
      setUser(u);

      if (u) {
        setLoading(true);
        try {
          // Try to fetch admin info first
          try {
            const adminInfo = await adminAPI.getMe();
            console.log("[AuthProvider] Admin role fetched", adminInfo);
            setUserInfo(adminInfo);
            setRole("ADMIN");
          } catch (adminError) {
            // If not admin, try supervisor
            try {
              const supervisorInfo = await supervisorAPI.getMe();
              console.log(
                "[AuthProvider] Supervisor role fetched",
                supervisorInfo
              );
              setUserInfo(supervisorInfo);
              setRole("SUPERVISOR");
            } catch (supervisorError) {
              console.error(
                "[AuthProvider] Failed to fetch role from both endpoints",
                {
                  adminError,
                  supervisorError,
                }
              );
              setUserInfo(null);
              setRole(null);
            }
          }
        } catch (e) {
          console.error("[AuthProvider] Failed to fetch user info", e);
          setUserInfo(null);
          setRole(null);
        } finally {
          setLoading(false);
        }
      } else {
        setUserInfo(null);
        setRole(null);
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const value = useMemo<AuthContextState>(
    () => ({ user, userInfo, role, loading }),
    [user, userInfo, role, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
