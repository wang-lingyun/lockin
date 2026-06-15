"use client";

import { useActionState } from "react";
import type { Reflection } from "@/lib/db/types";
import { saveReflectionAction } from "../actions";

type ActionState = { error: string } | null;

const input =
  "rounded-md border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary min-h-20 resize-y";

const PROMPTS: {
  name: keyof Pick<
    Reflection,
    "what_finished" | "what_was_hard" | "what_learned" | "what_to_do_next"
  >;
  label: string;
  placeholder: string;
}[] = [
  {
    name: "what_finished",
    label: "What did I finish today?",
    placeholder: "Tasks, problems, drafts, features…",
  },
  {
    name: "what_was_hard",
    label: "What was hard?",
    placeholder: "Where did I get stuck?",
  },
  {
    name: "what_learned",
    label: "What did I learn?",
    placeholder: "A new idea, a fix, a trick…",
  },
  {
    name: "what_to_do_next",
    label: "What should I do tomorrow?",
    placeholder: "The next step.",
  },
];

// Map snake_case column → camelCase form field name the action reads.
const FIELD: Record<string, string> = {
  what_finished: "whatFinished",
  what_was_hard: "whatWasHard",
  what_learned: "whatLearned",
  what_to_do_next: "whatToDoNext",
};

/**
 * Today's reflection (PRD §10.11). In create mode (no `reflection`) it posts a
 * new reflection for `studentId`/`date`; in edit mode it updates the existing one
 * via a hidden `id`.
 */
export function ReflectionForm({
  studentId,
  date,
  reflection,
}: {
  studentId: string;
  date: string;
  reflection: Reflection | null;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    saveReflectionAction,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      {reflection ? (
        <input type="hidden" name="id" value={reflection.id} />
      ) : (
        <>
          <input type="hidden" name="studentId" value={studentId} />
          <input type="hidden" name="date" value={date} />
        </>
      )}

      {PROMPTS.map((p) => (
        <label key={p.name} className="flex flex-col gap-1">
          <span className="text-xs text-muted">{p.label}</span>
          <textarea
            name={FIELD[p.name]}
            defaultValue={reflection?.[p.name] ?? ""}
            placeholder={p.placeholder}
            maxLength={4000}
            className={input}
          />
        </label>
      ))}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 disabled:opacity-50"
        >
          {pending
            ? "Saving…"
            : reflection
              ? "Update reflection"
              : "Save reflection"}
        </button>
        {state?.error ? (
          <p className="text-sm text-danger" role="alert">
            {state.error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
