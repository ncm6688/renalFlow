import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetch } from "../lib/http";

type User = { id: string; name: string; email: string; role?: "customer" | "admin" };

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;

  setTokens(accessToken: string | null, refreshToken: string | null): void;
  login(email: string, password: string): Promise<void>;
  register(name: string, email: string, password: string): Promise<void>;
  logout(): void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      loading: false,
      error: null,

      setTokens(accessToken, refreshToken) {
        set({ accessToken, refreshToken });
      },

      async login(email, password) {
        set({ loading: true, error: null });
        try {
          const res = await apiFetch<{
            accessToken: string;
            refreshToken: string;
            user: User;
          }>("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
          });
          set({
            accessToken: res.accessToken,
            refreshToken: res.refreshToken,
            user: res.user,
            loading: false,
          });
        } catch (e) {
          set({ loading: false, error: e instanceof Error ? e.message : "Login failed" });
          throw e;
        }
      },

      async register(name, email, password) {
        set({ loading: true, error: null });
        try {
          const res = await apiFetch<{
            accessToken: string;
            refreshToken: string;
            user: User;
          }>("/api/auth/register", {
            method: "POST",
            body: JSON.stringify({ name, email, password }),
          });
          set({
            accessToken: res.accessToken,
            refreshToken: res.refreshToken,
            user: res.user,
            loading: false,
          });
        } catch (e) {
          set({ loading: false, error: e instanceof Error ? e.message : "Register failed" });
          throw e;
        }
      },

      logout() {
        set({ accessToken: null, refreshToken: null, user: null, error: null });
      },
    }),
    { name: "renalflow-auth" }
  )
);

