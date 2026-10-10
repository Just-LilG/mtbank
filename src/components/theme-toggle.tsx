"use client";

import { useState, useSyncExternalStore } from "react";
import { Segmented } from "@/components/staff/ui";

type Pref = "system" | "light" | "dark";
const subscribe = () => () => {};

function stored(): Pref {
  try {
    const value = localStorage.getItem("ubex:theme");
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

export function ThemeToggle() {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const [pref, setPref] = useState<Pref | null>(null);
  const value = pref ?? (mounted ? stored() : "system");

  function choose(next: Pref) {
    setPref(next);
    try {
      if (next === "system") {
        localStorage.removeItem("ubex:theme");
        delete document.documentElement.dataset.theme;
      } else {
        localStorage.setItem("ubex:theme", next);
        document.documentElement.dataset.theme = next;
      }
    } catch {
      /* storage can be blocked; the choice still applies until the page closes */
    }
  }

  return (
    <Segmented
      label="Appearance"
      value={value}
      onChange={choose}
      options={[
        { value: "system", label: "Match phone" },
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
      ]}
    />
  );
}
