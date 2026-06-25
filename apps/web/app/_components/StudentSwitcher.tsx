import Link from "next/link";
import { withStudent } from "@/lib/nav/withStudent";
import type { Student } from "@/lib/db/types";

/**
 * The in-account student switcher (ADR 0004): a row of pills that keep you on
 * the current page (`basePath`) while changing the active student. Extracted
 * from the copy that used to live inline on every page.
 */
export function StudentSwitcher({
  students,
  activeId,
  basePath,
}: {
  students: Student[];
  activeId: string | null;
  basePath: string;
}) {
  if (students.length <= 1) return null;
  return (
    <nav className="flex flex-wrap gap-2">
      {students.map((s) => {
        const isActive = activeId === s.id;
        return (
          <Link
            key={s.id}
            href={withStudent(basePath, s.id)}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              isActive
                ? "border-primary bg-primary text-primary-fg"
                : "border-border text-muted hover:text-text"
            }`}
          >
            {s.name}
          </Link>
        );
      })}
    </nav>
  );
}
