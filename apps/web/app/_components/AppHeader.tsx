import Link from "next/link";
import { signOut } from "../login/actions";
import { withStudent } from "@/lib/nav/withStudent";
import { StudentSwitcher } from "./StudentSwitcher";
import type { Student } from "@/lib/db/types";

/**
 * The one shared header for the whole app. It encodes the product's two
 * focuses (Stage 8): a calm **Today** mode for doing today's work, and a
 * **Manage** mode for planning (schedule + settings + the rest). The primary
 * toggle switches mode; a secondary row navigates within the active mode.
 *
 * Pass `current` = the page's key (below). Everything else — which mode is
 * active, what to highlight, where the student switcher returns to — is derived
 * from it, so each page just renders <AppHeader current="schedule" ... />.
 */

type NavKey =
  | "today"
  | "homework"
  | "reflections"
  | "coding"
  | "mistakes"
  | "manage"
  | "schedule"
  | "settings"
  | "quests";

type NavItem = { key: NavKey; href: string; label: string };

const TODAY_HOME: NavItem = { key: "today", href: "/", label: "Today" };
const MANAGE_HOME: NavItem = { key: "manage", href: "/manage", label: "Manage" };

// Secondary links within each mode (the mode's home is the toggle itself).
// Today stays calm — only Reflections; the "doing"/admin pages live under Manage.
const TODAY_LINKS: NavItem[] = [
  { key: "reflections", href: "/reflections", label: "Reflections" },
];
const MANAGE_LINKS: NavItem[] = [
  { key: "schedule", href: "/schedule", label: "Schedule" },
  { key: "settings", href: "/settings", label: "Settings" },
  { key: "quests", href: "/quests", label: "Quests" },
  { key: "homework", href: "/homework", label: "Homework" },
  { key: "coding", href: "/coding", label: "Coding" },
  { key: "mistakes", href: "/mistakes", label: "Mistakes" },
];

const HREF_BY_KEY: Record<NavKey, string> = Object.fromEntries(
  [TODAY_HOME, MANAGE_HOME, ...TODAY_LINKS, ...MANAGE_LINKS].map((i) => [
    i.key,
    i.href,
  ]),
) as Record<NavKey, string>;

function modeOf(current: NavKey): "today" | "manage" {
  if (current === "manage" || MANAGE_LINKS.some((i) => i.key === current)) {
    return "manage";
  }
  return "today";
}

export function AppHeader({
  email,
  students,
  activeId,
  current,
}: {
  email: string;
  students: Student[];
  activeId: string | null;
  current: NavKey;
}) {
  const mode = modeOf(current);
  const secondary = mode === "manage" ? MANAGE_LINKS : TODAY_LINKS;
  const basePath = HREF_BY_KEY[current];

  const toggle = (item: NavItem, active: boolean) => (
    <Link
      href={withStudent(item.href, activeId)}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-primary text-primary-fg"
          : "text-muted hover:text-text"
      }`}
    >
      {item.label}
    </Link>
  );

  return (
    <header className="mb-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link href={withStudent("/", activeId)} className="flex flex-col">
          <span className="text-2xl font-bold text-text">LockIn</span>
          {email ? <span className="text-sm text-muted">{email}</span> : null}
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-border p-1">
            {toggle(TODAY_HOME, mode === "today")}
            {toggle(MANAGE_HOME, mode === "manage")}
          </div>
          <form action={signOut}>
            <button className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:text-text">
              Sign out
            </button>
          </form>
        </div>
      </div>

      <StudentSwitcher
        students={students}
        activeId={activeId}
        basePath={basePath}
      />

      <nav className="flex flex-wrap gap-2">
        {secondary.map((item) => {
          const isActive = item.key === current;
          return (
            <Link
              key={item.key}
              href={withStudent(item.href, activeId)}
              className={`rounded-md border px-3 py-1.5 text-sm transition ${
                isActive
                  ? "border-primary text-text"
                  : "border-border text-muted hover:text-text"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
