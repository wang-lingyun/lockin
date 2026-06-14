import { LEVEL_THRESHOLDS } from "@lockin/shared";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">LockIn</h1>
        <p className="mt-2 text-lg text-[var(--color-muted)]">
          Math. Code. Focus. Level Up.
        </p>
      </div>

      <p className="text-[var(--color-muted)]">
        A private, multi-student learning dashboard. This is the Stage&nbsp;0 skeleton —
        auth, students, and missions arrive in Stage&nbsp;1.
      </p>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Level thresholds
        </h2>
        <ul className="mt-3 grid grid-cols-3 gap-2 text-sm sm:grid-cols-6">
          {LEVEL_THRESHOLDS.map((xp, i) => (
            <li
              key={i}
              className="rounded-lg bg-[var(--color-surface-2)] px-3 py-2 text-center"
            >
              <div className="text-[var(--color-muted)]">L{i + 1}</div>
              <div className="font-semibold">{xp}</div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
