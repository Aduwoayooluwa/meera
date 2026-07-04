"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App as AntdApp, ConfigProvider, theme } from "antd";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  toggleMode: () => void;
};

const ThemeModeContext = createContext<ThemeContextValue | null>(null);
const THEME_STORAGE_KEY = "mm-theme";
const THEME_CHANGE_EVENT = "mm-theme-change";

export function useThemeMode() {
  const value = useContext(ThemeModeContext);

  if (!value) {
    throw new Error("useThemeMode must be used within Providers.");
  }

  return value;
}

function getInitialMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getServerMode(): ThemeMode {
  return "light";
}

function subscribeToThemeChanges(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  mediaQuery.addEventListener("change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
    mediaQuery.removeEventListener("change", onStoreChange);
  };
}

function saveMode(mode: ThemeMode) {
  localStorage.setItem(THEME_STORAGE_KEY, mode);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
          },
        },
      }),
  );
  const mode = useSyncExternalStore(
    subscribeToThemeChanges,
    getInitialMode,
    getServerMode,
  );

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      toggleMode: () =>
        saveMode(mode === "dark" ? "light" : "dark"),
    }),
    [mode],
  );

  const isDark = mode === "dark";

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeModeContext.Provider value={value}>
        <ConfigProvider
          theme={{
            algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
            token: {
              colorPrimary: isDark ? "#2cc8b4" : "#0d6e66",
              colorSuccess: isDark ? "#34d058" : "#16a34a",
              colorWarning: "#f59e0b",
              colorError: isDark ? "#ff7b63" : "#f7614a",
              colorBgBase: isDark ? "#09111e" : "#f6f8fc",
              colorBgLayout: isDark ? "#09111e" : "#f6f8fc",
              colorBgContainer: isDark ? "#0f1a2b" : "#ffffff",
              colorBgElevated: isDark ? "#141f32" : "#ffffff",
              colorText: isDark ? "#e8edf5" : "#0e1117",
              colorTextSecondary: isDark ? "#8a97ab" : "#6b7280",
              colorBorder: isDark ? "#1e2d42" : "#e3e8f0",
              colorBorderSecondary: isDark ? "#1a2639" : "#edf1f7",
              borderRadius: 10,
              borderRadiusSM: 6,
              fontFamily:
                "var(--font-geist-sans), Inter, system-ui, sans-serif",
              controlHeight: 40,
              fontSize: 14,
            },
            components: {
              Button: {
                controlHeight: 38,
                fontWeight: 700,
              },
              Input: {
                controlHeight: 40,
              },
              Select: {
                controlHeight: 40,
              },
              Form: {
                labelFontSize: 12,
              },
            },
          }}
        >
          <AntdApp>{children}</AntdApp>
        </ConfigProvider>
      </ThemeModeContext.Provider>
    </QueryClientProvider>
  );
}
