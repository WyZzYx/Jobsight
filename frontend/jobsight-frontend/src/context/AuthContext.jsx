// src/context/AuthContext.jsx
import React, { createContext, useCallback, useContext, useState } from "react";
import { auth } from "../lib/auth";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [me, setMe] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const u = await auth.me();
      setMe(u);
      return u;
    } catch {
      setMe(null); // 401 is normal when not logged in
      return null;
    }
  }, []);

  const login = useCallback(async (email, password) => {
    await auth.login(email, password); // sets bearer + cookie
    return refresh();
  }, [refresh]);

  const register = useCallback(async (email, password) => {
    await auth.register(email, password);
    return refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await auth.logout();
    setMe(null);
  }, []);

  return (
      <Ctx.Provider value={{ me, refresh, login, register, logout }}>
        {children}
      </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
