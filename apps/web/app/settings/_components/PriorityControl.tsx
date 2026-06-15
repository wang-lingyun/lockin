import type { PriorityType } from "@/lib/db/types";

/**
 * Three-way priority selector rendered as a single form with three submit
 * buttons. Server component — clicking a button submits the given server action
 * with `priority` set; the currently-selected value is highlighted. No client JS.
 */

const OPTIONS: { value: PriorityType; label: string; activeClass: string }[] = [
  { value: "primary", label: "Primary", activeClass: "bg-primary text-primary-fg" },
  { value: "bonus", label: "Bonus", activeClass: "bg-warning text-bg" },
  { value: "inactive", label: "Off", activeClass: "bg-surface-2 text-muted" },
];

export function PriorityControl({
  action,
  hidden,
  current,
}: {
  action: (formData: FormData) => Promise<void>;
  hidden: Record<string, string>;
  current: PriorityType;
}) {
  return (
    <form action={action} className="flex gap-1">
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {OPTIONS.map((o) => {
        const active = o.value === current;
        return (
          <button
            key={o.value}
            name="priority"
            value={o.value}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              active
                ? o.activeClass
                : "border border-border text-muted hover:text-text"
            }`}
            aria-pressed={active}
          >
            {o.label}
          </button>
        );
      })}
    </form>
  );
}
