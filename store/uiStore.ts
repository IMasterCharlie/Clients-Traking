import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeTheme: 'light' | 'dark' | 'system';
  setActiveTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  activeTheme: 'system',
  setActiveTheme: (theme) => set({ activeTheme: theme }),
}));
