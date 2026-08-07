import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95 mt-auto">
      <div className="container py-12 md:py-16 px-4 mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <span className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                Instahub
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Premium social media growth services for creators, influencers, and brands.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/instagram" className="hover:text-primary transition-colors">Instagram Followers</Link></li>
              <li><Link href="/instagram" className="hover:text-primary transition-colors">Instagram Likes</Link></li>
              <li><Link href="/tiktok" className="hover:text-primary transition-colors">TikTok Views</Link></li>
              <li><Link href="/twitter" className="hover:text-primary transition-colors">Twitter Retweets</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="/track-order" className="hover:text-primary transition-colors">Track Order</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/refund-policy" className="hover:text-primary transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Instahub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
