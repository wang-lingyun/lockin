import Link from "next/link";
import { requireParent } from "@/lib/auth/session";
import type { Student, Reward } from "@/lib/db/types";
import { XpBar } from "../_components/XpBar";
import { RewardForm } from "./_components/RewardForm";
import { RewardList } from "./_components/RewardList";
import { XpAdjustForm } from "./_components/XpAdjustForm";

export const metadata = { title: "Rewards · LockIn" };

export default async function RewardsPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const parent = await requireParent();
  const { supabase } = parent;
  const sp = await searchParams;

  const { data: studentsData } = await supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: true });
  const students = (studentsData ?? []) as Student[];
  const active = students.find((s) => s.id === sp.student) ?? students[0] ?? null;

  let rewards: Reward[] = [];
  if (active) {
    const { data } = await supabase
      .from("rewards")
      .select("*")
      .eq("student_id", active.id)
      .order("required_xp", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    rewards = (data ?? []) as Reward[];
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Rewards</h1>
          <p className="text-sm text-muted">
            Rewards unlock automatically when XP reaches the goal.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:text-text"
        >
          ← Dashboard
        </Link>
      </header>

      {students.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">
          Add a student on the dashboard first.
        </p>
      ) : (
        <>
          <nav className="mb-6 flex flex-wrap gap-2">
            {students.map((s) => {
              const isActive = active?.id === s.id;
              return (
                <Link
                  key={s.id}
                  href={`/rewards?student=${s.id}`}
                  className={`rounded-full border px-4 py-1.5 text-sm transition ${
                    isActive
                      ? "border-primary bg-primary text-primary-fg"
                      : "border-border text-muted hover:text-text"
                  }`}
                >
                  {s.name} · L{s.current_level}
                </Link>
              );
            })}
          </nav>

          {active ? (
            <>
              <section className="mb-6 rounded-xl border border-border bg-surface p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-text">
                    {active.name}
                  </h2>
                </div>
                <XpBar xp={active.current_xp} />
                <div className="mt-4 border-t border-border pt-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    Adjust XP
                  </h3>
                  <XpAdjustForm studentId={active.id} />
                </div>
              </section>

              <section className="mb-6 rounded-xl border border-border bg-surface p-5">
                <h2 className="mb-3 text-sm font-semibold text-text">
                  Add a reward for {active.name}
                </h2>
                <RewardForm studentId={active.id} />
              </section>

              {rewards.length === 0 ? (
                <p className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">
                  No rewards yet.
                </p>
              ) : (
                <RewardList rewards={rewards} currentXp={active.current_xp} />
              )}
            </>
          ) : null}
        </>
      )}
    </main>
  );
}
