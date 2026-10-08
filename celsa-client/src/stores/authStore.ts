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
  setUser: (user: UserPayload) => void;
}

function setClientCookie(token: string, role?: string) {
  if (role === "admin" || role === "staff") {
    // Session-only cookie for admin/staff: no max-age so browser discards it on exit
    document.cookie = `celsa_token=${token}; path=/; SameSite=Lax`;
  } else {
    // Persistent cookie for customers (1 day)
    document.cookie = `celsa_token=${token}; path=/; max-age=86400; SameSite=Lax`;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  setUser: (user) => set({ user }),

  hydrate: async () => {
    if (typeof window === "undefined") return;

    const sessionToken = sessionStorage.getItem("celsa_access_token");
    const localToken = localStorage.getItem("celsa_access_token");
    const pathname = window.location.pathname;
    const isAdminOrStaffRoute = pathname.startsWith("/admin") || pathname.startsWith("/staff");

    // If visiting admin/staff and no tab session token exists, the previous tab was closed!
    // Admin/staff sessions must NEVER survive a closed tab.
    if (isAdminOrStaffRoute && !sessionToken) {
      localStorage.removeItem("celsa_access_token");
      document.cookie = "celsa_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0";
      set({ user: null, accessToken: null, isAuthenticated: false });
      return;
    }

    const token = sessionToken || localToken;
    if (token) {
      try {
        const payload = jwtDecode<CelsaJwtPayload>(token);
        // Check expiration
        if (payload.exp && payload.exp * 1000 > Date.now()) {
          // If the token belongs to admin or staff, ensure it was strictly stored in sessionStorage
          if ((payload.role === "admin" || payload.role === "staff") && !sessionToken) {
            localStorage.removeItem("celsa_access_token");
            document.cookie = "celsa_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0";
            set({ user: null, accessToken: null, isAuthenticated: false });
            return;
          }

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

    // If on admin or staff route and token is missing or expired, do not quietly refresh
    if (isAdminOrStaffRoute) {
      localStorage.removeItem("celsa_access_token");
      sessionStorage.removeItem("celsa_access_token");
      document.cookie = "celsa_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0";
      set({ user: null, accessToken: null, isAuthenticated: false });
      return;
    }

    // For customer storefront: Token missing or expired — try refresh token cookie quietly
    await get().refresh();
  },

  login: async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { accessToken, user } = res.data;

    if (user?.role === "admin" || user?.role === "staff") {
      sessionStorage.setItem("celsa_access_token", accessToken);
      localStorage.removeItem("celsa_access_token");
    } else {
      localStorage.setItem("celsa_access_token", accessToken);
      sessionStorage.removeItem("celsa_access_token");
    }
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
      sessionStorage.removeItem("celsa_access_token");
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
    if (typeof window !== "undefined") {
      localStorage.removeItem("celsa_access_token");
      sessionStorage.removeItem("celsa_access_token");
      document.cookie = "celsa_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0";
    }
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

      if (payload.role === "admin" || payload.role === "staff") {
        sessionStorage.setItem("celsa_access_token", accessToken);
        localStorage.removeItem("celsa_access_token");
      } else {
        localStorage.setItem("celsa_access_token", accessToken);
        sessionStorage.removeItem("celsa_access_token");
      }
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
      if (typeof window !== "undefined") {
        localStorage.removeItem("celsa_access_token");
        sessionStorage.removeItem("celsa_access_token");
        document.cookie = "celsa_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0";
      }
      set({ user: null, accessToken: null, isAuthenticated: false });
      return false;
    }
  },
}));
