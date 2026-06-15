import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in · LockIn" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">LockIn</h1>
        <p className="mt-1 text-sm text-muted">
          Parent sign-in. Your kids&apos; learning data stays private.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
