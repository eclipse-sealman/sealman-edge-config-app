import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_THEME_ID } from "./themes";

// Must match index.html.
export const DEFAULT_APP_TITLE = "EdgeConfig App";
export const DEFAULT_FAVICON = "/sealman.ico";

interface AppearanceState {
  themeId: string;
  customCss: string;
  /** Uploaded logo as data URL; null means the bundled Sealman logo. */
  logoDataUrl: string | null;
  /** Browser tab title; empty means the default from index.html. */
  appTitle: string;
  /** Uploaded tab icon as data URL; null means the bundled favicon. */
  faviconDataUrl: string | null;
  setThemeId: (themeId: string) => void;
  setCustomCss: (css: string) => void;
  setLogoDataUrl: (dataUrl: string | null) => void;
  setAppTitle: (title: string) => void;
  setFaviconDataUrl: (dataUrl: string | null) => void;
}

/** The backend has no appearance settings yet, so they're persisted locally in the browser. */
const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set) => ({
      themeId: DEFAULT_THEME_ID,
      customCss: "",
      logoDataUrl: null,
      appTitle: "",
      faviconDataUrl: null,
      setThemeId: (themeId) => set({ themeId }),
      setCustomCss: (customCss) => set({ customCss }),
      setLogoDataUrl: (logoDataUrl) => set({ logoDataUrl }),
      setAppTitle: (appTitle) => set({ appTitle }),
      setFaviconDataUrl: (faviconDataUrl) => set({ faviconDataUrl }),
    }),
    { name: "sealman.appearance" },
  ),
);

export default useAppearanceStore;
