"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * A `<details>`-based dropdown menu that closes when the user clicks anywhere
 * outside it or presses Escape — native `<details>` only toggles via its
 * summary, so it would otherwise stay open until clicked again. Children are the
 * menu body (typically server-action forms); `summary` is the trigger label.
 */
export function Menu({
  summary,
  label,
  children,
}: {
  summary: ReactNode;
  label?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const el = ref.current;
      if (el?.open && !el.contains(e.target as Node)) el.open = false;
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && ref.current) ref.current.open = false;
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Close on submit too: once an action fires the row re-renders and the open
  // menu would otherwise linger over stale content.
  function close() {
    if (ref.current) ref.current.open = false;
  }

  return (
    <details ref={ref} className="group relative">
      <summary
        className="flex cursor-pointer list-none items-center rounded-md border border-border px-2 py-1.5 text-sm text-muted hover:text-text"
        aria-label={label}
      >
        {summary}
      </summary>
      <div
        className="absolute right-0 z-10 mt-1 flex w-44 flex-col rounded-md border border-border bg-surface p-1 shadow-lg"
        onSubmit={close}
      >
        {children}
      </div>
    </details>
  );
}
