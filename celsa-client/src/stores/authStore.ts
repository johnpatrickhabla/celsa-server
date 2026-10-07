import { create } from "zustand";
import { jwtDecode } from "jwt-decode";
import api from "@/lib/api";

export interface UserPayload {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "staff" | "customer";
}

interface CelsaJwtPayload {
  sub: string;
  email: string;
  role: "admin" | "staff" | "customer";
  name: string;
  exp?: number;
}

interface AuthState {
  user: UserPayload | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: (redirect?: boolean | unknown) => Promise<void>;
  refresh: () => Promise<boolean>;
}

function setClientCookie(token: string, role?: string) {
  const maxAge = role === "customer" ? 86400 : 7 * 86400; // 1 day for customer, 7 days for staff/admin
  document.cookie = `celsa_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  hydrate: async () => {
    const token = localStorage.getItem("celsa_access_token");
    if (token) {
      try {
        const payload = jwtDecode<CelsaJwtPayload>(token);
        // Check expiration
        if (payload.exp && payload.exp * 1000 > Date.now()) {
          set({
            user: {
              _id: payload.sub,
              name: payload.name,
              email: payload.email,
              role: payload.role,
            },
            accessToken: token,
            isAuthenticated: true,
          });
          return;
        }
      } catch {
        // Invalid token format
      }
    }

    // Token missing or expired — try refresh token cookie quietly
    await get().refresh();
  },

  login: async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { accessToken, user } = res.data;

    localStorage.setItem("celsa_access_token", accessToken);
    setClientCookie(accessToken, user?.role);

    set({
      user,
      accessToken,
      isAuthenticated: true,
    });
  },

  signup: async (name, email, password) => {
    const res = await api.post("/auth/signup", { name, email, password });
    const { accessToken, user } = res.data;

    if (accessToken) {
      localStorage.setItem("celsa_access_token", accessToken);
      setClientCookie(accessToken, user?.role);

      set({
        user,
        accessToken,
        isAuthenticated: true,
      });
    }
  },

  logout: async (redirect = true) => {
    const shouldRedirect = typeof redirect === "boolean" ? redirect : true;
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore network errors
    }
    localStorage.removeItem("celsa_access_token");
    document.cookie = "celsa_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0";
    set({ user: null, accessToken: null, isAuthenticated: false });
    if (shouldRedirect && typeof window !== "undefined") {
      window.location.href = "/";
    }
  },

  refresh: async () => {
    try {
      const res = await api.post("/auth/refresh");
      const { accessToken } = res.data;
      const payload = jwtDecode<CelsaJwtPayload>(accessToken);

      localStorage.setItem("celsa_access_token", accessToken);
      setClientCookie(accessToken, payload.role);

      set({
        user: {
          _id: payload.sub,
          name: payload.name,
          email: payload.email,
          role: payload.role,
        },
        accessToken,
        isAuthenticated: true,
      });
      return true;
    } catch {
      localStorage.removeItem("celsa_access_token");
      document.cookie = "celsa_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0";
      set({ user: null, accessToken: null, isAuthenticated: false });
      return false;
    }
  },
}));
