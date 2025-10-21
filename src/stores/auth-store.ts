import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

type User = {
  id: string;
  email: string;
  name?: string;
};

type AuthState = {
  user: User | null;
  setUser: (user: User | null) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        setUser: (user: User | null) => set({ user }, false, "setUser"),
        clearUser: () => set({ user: null }, false, "clearUser"),
      }),
      { name: "auth-store" }
    ),
    { name: "AuthStore" }
  )
);
