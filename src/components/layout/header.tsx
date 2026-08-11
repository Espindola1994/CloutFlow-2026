import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-[#080B14]/92 backdrop-blur supports-[backdrop-filter]:bg-[#080B14]/60">
      <div className="container w-full max-w-[1200px] flex h-16 items-center justify-between px-4 md:px-6 lg:px-8 mx-auto">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Instahub
            </span>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/instagram" className="transition-colors hover:text-primary text-muted-foreground">Instagram</Link>
          <Link href="/tiktok" className="transition-colors hover:text-primary text-muted-foreground">TikTok</Link>
          <Link href="/track-order" className="transition-colors hover:text-primary text-muted-foreground">Track Order</Link>
          <Link href="/faq" className="transition-colors hover:text-primary text-muted-foreground">FAQ</Link>
        </nav>
        
        <div className="flex items-center gap-4">
          <Link href="/admin/login" className="hidden sm:inline-flex text-sm">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-surface">Log in</Button>
          </Link>
          <Link href="/instagram">
            <Button className="rounded-full px-6 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:brightness-110 border-0">Get Started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
