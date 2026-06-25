/**
 * Build an href that carries the active student through navigation. Every page
 * is `?student=`-scoped (the in-account student switcher, ADR 0004), so links
 * between pages must preserve it. Replaces the ad-hoc `sw()` closures that were
 * copied into several pages.
 */
export function withStudent(
  path: string,
  studentId?: string | null,
  extra?: Record<string, string>,
): string {
  const params = new URLSearchParams();
  if (studentId) params.set("student", studentId);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v) params.set(k, v);
    }
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}
