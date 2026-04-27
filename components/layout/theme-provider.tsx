"use client";

import * as React from "react";

/** Light-only: ensures `dark` is never applied to the document. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);
  return <>{children}</>;
}
