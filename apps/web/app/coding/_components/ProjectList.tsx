import type {
  CodingProjectRow,
  CodingProjectStatus,
  CodingFeatureStatus,
} from "@/lib/db/types";
import {
  setProjectStatusAction,
  deleteProjectAction,
  setFeatureStatusAction,
  deleteFeatureAction,
} from "../actions";
import { AddFeatureForm } from "./AddFeatureForm";

const PROJECT_STATUS_STYLE: Record<CodingProjectStatus, string> = {
  active: "bg-surface-2 text-accent",
  completed: "bg-success text-bg",
  archived: "bg-surface-2 text-muted",
};

const PROJECT_STATUSES: { value: CodingProjectStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

const FEATURE_STATUSES: { value: CodingFeatureStatus; label: string }[] = [
  { value: "not_started", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Done" },
];

const FEATURE_DOT: Record<CodingFeatureStatus, string> = {
  not_started: "border border-border",
  in_progress: "border border-warning bg-warning/30",
  completed: "bg-success",
};

const btn =
  "rounded-md border border-border px-2.5 py-1 text-xs text-muted hover:text-text disabled:opacity-40";

export function ProjectList({ projects }: { projects: CodingProjectRow[] }) {
  return (
    <ul className="flex flex-col gap-4">
      {projects.map((p) => {
        const done = p.features.filter((f) => f.status === "completed").length;
        return (
          <li
            key={p.id}
            className="rounded-xl border border-border bg-surface p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-semibold text-text">
                  {p.project_name}
                </p>
                {p.goal ? (
                  <p className="mt-0.5 text-sm text-muted">{p.goal}</p>
                ) : null}
                <p className="mt-1 text-xs text-muted">
                  {done}/{p.features.length} features done
                  {p.demo_link ? (
                    <>
                      {" · "}
                      <a
                        href={p.demo_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        demo
                      </a>
                    </>
                  ) : null}
                  {p.github_link ? (
                    <>
                      {" · "}
                      <a
                        href={p.github_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        code
                      </a>
                    </>
                  ) : null}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${PROJECT_STATUS_STYLE[p.status]}`}
              >
                {p.status}
              </span>
            </div>

            {p.description ? (
              <p className="mt-3 whitespace-pre-wrap text-sm text-text">
                {p.description}
              </p>
            ) : null}

            {/* Feature checklist */}
            <ul className="mt-4 flex flex-col gap-2">
              {p.features.map((f) => {
                const fDone = f.status === "completed";
                return (
                  <li
                    key={f.id}
                    className="rounded-lg bg-surface-2 px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-2">
                        <span
                          className={`mt-1 inline-block h-3 w-3 shrink-0 rounded-full ${FEATURE_DOT[f.status]}`}
                        />
                        <div className="min-w-0">
                          <p
                            className={`text-sm ${
                              fDone ? "text-muted line-through" : "text-text"
                            }`}
                          >
                            {f.title}
                          </p>
                          {f.description ? (
                            <p className="text-xs text-muted">
                              {f.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      {f.xp_awarded > 0 ? (
                        <span className="shrink-0 text-xs text-success">
                          +{f.xp_awarded} XP
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {FEATURE_STATUSES.map((s) => (
                        <form key={s.value} action={setFeatureStatusAction}>
                          <input type="hidden" name="id" value={f.id} />
                          <input type="hidden" name="status" value={s.value} />
                          <button disabled={s.value === f.status} className={btn}>
                            {s.value === "completed" && f.xp_awarded === 0
                              ? `${s.label} (+20 XP)`
                              : s.label}
                          </button>
                        </form>
                      ))}
                      <form action={deleteFeatureAction} className="ml-auto">
                        <input type="hidden" name="id" value={f.id} />
                        <button className={btn}>Delete</button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-3">
              <AddFeatureForm projectId={p.id} />
            </div>

            {/* Project status + delete */}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <span className="text-xs text-muted">Project:</span>
              {PROJECT_STATUSES.map((s) => (
                <form key={s.value} action={setProjectStatusAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="status" value={s.value} />
                  <button disabled={s.value === p.status} className={btn}>
                    {s.label}
                  </button>
                </form>
              ))}
              <form action={deleteProjectAction} className="ml-auto">
                <input type="hidden" name="id" value={p.id} />
                <button className={btn}>Delete project</button>
              </form>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
