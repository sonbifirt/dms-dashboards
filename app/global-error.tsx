"use client";

import * as React from "react";

import "./globals.css";

/**
 * Catches root layout errors. Must include html/body (separate from root layout).
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error#global-error
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="text-lg font-semibold">Application error</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            {error.message || "A critical error occurred. Please try again."}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
