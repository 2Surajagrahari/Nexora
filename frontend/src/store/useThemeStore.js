import { create } from "zustand";

export const useThemeStore = create((set) => ({
    theme: localStorage.getItem("Nexora-theme") || "coffee",
    setTheme: (theme) => {
        localStorage.setItem("Nexora-theme", theme);
        set({ theme });
    },
}));