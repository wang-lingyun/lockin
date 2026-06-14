import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LockIn",
  description: "Math. Code. Focus. Level Up. A private learning dashboard for kids.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
