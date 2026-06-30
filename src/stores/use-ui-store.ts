import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      searchOpen: false,
      setSearchOpen: (open: boolean) => set({ searchOpen: open }),
    }),
    { name: "ui-store" }
  )
);
