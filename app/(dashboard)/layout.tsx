import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                Af
              </span>
            </div>
            <div>
              <span className="font-semibold text-sm">AfCEN</span>
              <span className="text-muted-foreground text-xs ml-1.5">
                Asset Recycling
              </span>
            </div>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Pipeline
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
