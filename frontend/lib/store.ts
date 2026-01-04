import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'JOB_SEEKER' | 'INTERVIEWER';
  organizationId?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isHydrated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
}

// Create the store with better SSR compatibility
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isHydrated: false,
      setAuth: (user, accessToken, refreshToken) => {
        set({ user, accessToken, refreshToken });
      },
      clearAuth: () => {
        set({ user: null, accessToken: null, refreshToken: null });
      },
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => {
        // Use localStorage only on client side
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => null,
          removeItem: () => null,
        };
      }),
      onRehydrateStorage: () => (state) => {
        // Set hydrated flag after rehydration
        if (state) {
          state.isHydrated = true;
        }
      },
      // Skip hydration on server
      skipHydration: typeof window === 'undefined',
    }
  )
);

// Export a function to get current state synchronously (for API interceptor)
export const getAuthState = () => {
  if (typeof window === 'undefined') {
    // Return default state on server
    return {
      user: null,
      accessToken: null,
      refreshToken: null,
      isHydrated: false,
      setAuth: () => {},
      clearAuth: () => {},
      updateUser: () => {},
    };
  }
  return useAuthStore.getState();
};

