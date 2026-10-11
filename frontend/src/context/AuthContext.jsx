import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api.js";

const AuthContext = createContext(null);

const STORAGE_KEY = "vericlaim_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem(STORAGE_KEY));

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled) setUser(data);
      } catch {
        if (!cancelled) {
          setUser(null);
          setToken("");
          localStorage.removeItem(STORAGE_KEY);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const persistSession = (data) => {
    localStorage.setItem(STORAGE_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", {
        email: String(email).trim().toLowerCase(),
        password,
      });
      return persistSession(data);
    } catch (err) {
      const data = err.response?.data;
      if (data?.requiresVerification) {
        const e = new Error(data.message || "Email not verified");
        e.requiresVerification = true;
        e.email = data.email;
        e.emailPreviewUrl = data.emailPreviewUrl;
        e.devCode = data.devCode;
        throw e;
      }
      throw err;
    }
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", {
      ...payload,
      email: String(payload.email || "").trim().toLowerCase(),
    });
    return data;
  };

  const registerAdmin = async (payload) => {
    const { data } = await api.post("/auth/register-admin", {
      ...payload,
      email: String(payload.email || "").trim().toLowerCase(),
    });
    return data;
  };

  const registerDepartmentAdmin = async (payload) => {
    const { data } = await api.post("/auth/register-department-admin", {
      ...payload,
      email: String(payload.email || "").trim().toLowerCase(),
      departmentCode: String(payload.departmentCode || "").toUpperCase().trim(),
    });
    return data;
  };

  const verifyEmail = async (email, code) => {
    const { data } = await api.post("/auth/verify-email", {
      email: String(email).trim().toLowerCase(),
      code: String(code).trim(),
    });
    return persistSession(data);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken("");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      register,
      registerAdmin,
      registerDepartmentAdmin,
      verifyEmail,
      logout,
      isAuthenticated: !!user,
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
