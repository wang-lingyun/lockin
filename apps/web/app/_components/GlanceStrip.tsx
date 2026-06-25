import Link from "next/link";
import { withStudent } from "@/lib/nav/withStudent";
import type { StudentGlance } from "@/lib/dashboard/glance";

/**
 * All students at a glance (PRD §10.1): one compact card per student with
 * today's completion, streak, and attention counts. Lives on the Manage
 * overview; each card links to that student's Today screen.
 */
export function GlanceStrip({ glances }: { glances: StudentGlance[] }) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {glances.map((g) => (
        <Link
          key={g.student.id}
          href={withStudent("/", g.student.id)}
          className="rounded-xl border border-border bg-surface p-4 hover:border-primary"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-text">{g.student.name}</span>
            <span className="text-xs text-muted">🔥 {g.streak}d</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span>
              ✅ {g.missionsDone}/{g.missionsTotal} today
            </span>
            {g.toReview > 0 ? (
              <span className="text-accent">📥 {g.toReview}</span>
            ) : null}
            {g.toRevisit > 0 ? (
              <span className="text-accent">📝 {g.toRevisit}</span>
            ) : null}
          </div>
        </Link>
      ))}
    </section>
  );
}
