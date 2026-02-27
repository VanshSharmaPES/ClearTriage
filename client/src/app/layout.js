import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "ClearTriage — Intelligent Hospital Triage",
  description: "Glass-Box AI-powered hospital triage system with explainable predictions",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 border-b"
          style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}>
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span className="text-xl font-bold" style={{ color: 'var(--accent)' }}>⚕</span>
            <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>ClearTriage</span>
          </Link>
          <div className="flex gap-1">
            <Link href="/dashboard"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 no-underline"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={undefined}
            >
              Dashboard
            </Link>
            <Link href="/admit"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 no-underline"
              style={{ color: 'var(--text-secondary)' }}
            >
              Admit Patient
            </Link>
          </div>
        </nav>

        {/* Main Content */}
        <main className="pt-16">
          {children}
        </main>
      </body>
    </html>
  );
}
