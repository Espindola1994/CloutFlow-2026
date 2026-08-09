import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container w-full max-w-[1200px] flex h-16 items-center justify-between px-4 md:px-6 lg:px-8 mx-auto">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Instahub
            </span>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/instagram" className="transition-colors hover:text-primary">Instagram</Link>
          <Link href="/tiktok" className="transition-colors hover:text-primary">TikTok</Link>
          <Link href="/track-order" className="transition-colors hover:text-primary">Track Order</Link>
          <Link href="/faq" className="transition-colors hover:text-primary">FAQ</Link>
        </nav>
        
        <div className="flex items-center gap-4">
          <Link href="/admin/login" className="hidden sm:inline-flex text-sm">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/instagram">
            <Button className="rounded-full px-6">Get Started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
