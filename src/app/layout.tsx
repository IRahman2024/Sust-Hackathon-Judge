import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QueueStorm API Tester",
  description: "Test and score your QueueStorm Investigator API against the SUST Codex Hackathon rubric",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
