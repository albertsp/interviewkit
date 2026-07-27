"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { getMyStats } from "@/services/sessionService";
import { getMyProfile } from "@/services/authService";
import { logoutUser } from "@/services/authService";
import { setOnUnauthorized } from "@/services/httpClient";
import type { StatsResponse } from "@/services/sessionService";

interface AuthContextValue {
  user: string | null;
  stats: StatsResponse;
  initialized: boolean;
  login: (logUser: string, token?: string) => void;
  loginFromOAuth: (token?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshStats: () => Promise<void>;
  updateUser: (newName: string) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEFAULT_STATS: StatsResponse = {
  total_xp: 0,
  level: 1,
  xp_to_next_level: 0,
  progress_in_level: 0,
  xp_per_level: 0,
  results_summary: { correct: 0, partially_correct: 0, incorrect: 0 },
  stacks_stats: [],
  sessions_count: 0,
  recent_sessions: [],
  cards_summary: { total: 0, top_tags: [] },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [initialized, setInitialized] = useState(false);
  const refreshingRef = useRef(false);

  useEffect(() => {
    setOnUnauthorized(() => {
      localStorage.removeItem("user");
      localStorage.removeItem("access_token");
      setUser(null);
      setStats(DEFAULT_STATS);
    });
  }, []);

  const refreshStats = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      const data = await getMyStats();
      setStats({
        total_xp: data.total_xp ?? 0,
        level: data.level ?? 1,
        xp_to_next_level: data.xp_to_next_level ?? 0,
        progress_in_level: data.progress_in_level ?? 0,
        xp_per_level: data.xp_per_level ?? 0,
        results_summary: data.results_summary ?? DEFAULT_STATS.results_summary,
        stacks_stats: data.stacks_stats ?? DEFAULT_STATS.stacks_stats,
        sessions_count: data.sessions_count ?? DEFAULT_STATS.sessions_count,
        recent_sessions: data.recent_sessions ?? DEFAULT_STATS.recent_sessions,
        cards_summary: data.cards_summary ?? DEFAULT_STATS.cards_summary,
      });
    } catch {
    } finally {
      refreshingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing initial state from localStorage (external source) on mount
      setUser(savedUser);
      refreshStats();
    }
    setInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function login(logUser: string, token?: string) {
    const name = logUser || "User";
    if (token) localStorage.setItem("access_token", token);
    localStorage.setItem("user", name);
    setUser(name);
    refreshStats();
  }

  async function loginFromOAuth(token?: string) {
    if (token) localStorage.setItem("access_token", token);
    const profile = await getMyProfile();
    const name = profile.name || profile.email || "User";
    localStorage.setItem("user", name);
    setUser(name);
    await refreshStats();
  }

  function updateUser(newName: string) {
    localStorage.setItem("user", newName);
    setUser(newName);
  }

  async function logout() {
    try {
      await logoutUser();
    } catch {}
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    setUser(null);
    setStats(DEFAULT_STATS);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        stats,
        initialized,
        login,
        loginFromOAuth,
        logout,
        refreshStats,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth should be used inside AuthProvider");
  }

  return context;
}
