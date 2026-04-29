"use client";

import {
  ThemeToggleButton,
  useThemeTransition,
} from "@/components/ui/theme-toggle-button";
import { useTheme } from "next-themes";

export function ThemeSwitcherV1() {
  const { theme, setTheme } = useTheme();
  const { startTransition } = useThemeTransition();

  const handleToggle = () => {
    startTransition(() => {
      setTheme(theme === "dark" ? "light" : "dark");
    });
  };

  return (
    <ThemeToggleButton
      theme={theme === "dark" ? "dark" : "light"}
      variant="circle-blur"
      start="top-right"
      showLabel={false}
      onClick={handleToggle}
      className="p-1 rounded-lg hover:bg-accent text-foreground/70 hover:text-primary transition-colors"
    />
  );
}
