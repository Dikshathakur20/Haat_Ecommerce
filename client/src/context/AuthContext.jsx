import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api.js";

const AuthContext = createContext(null);
const KEY = "haat_auth";

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || { token: null, user: null };
    } catch {
      return { token: null, user: null };
    }
  });
  const [ready, setReady] = useState(false);

  // Keep localStorage in sync
  useEffect(() => {
    if (auth.token) localStorage.setItem(KEY, JSON.stringify(auth));
    else localStorage.removeItem(KEY);
  }, [auth]);

  // On first load, check that the saved token is still valid
  useEffect(() => {
    if (!auth.token) return setReady(true);
    api("/auth/me", { token: auth.token })
      .then((user) => setAuth((a) => ({ ...a, user })))
      .catch(() => setAuth({ token: null, user: null }))
      .finally(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email, password) {
    const data = await api("/auth/login", { method: "POST", body: { email, password } });
    setAuth({ token: data.token, user: data.user });
  }
  async function register(name, email, password) {
    const data = await api("/auth/register", { method: "POST", body: { name, email, password } });
    setAuth({ token: data.token, user: data.user });
  }
  const logout = () => setAuth({ token: null, user: null });

  return (
    <AuthContext.Provider value={{ user: auth.user, token: auth.token, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
