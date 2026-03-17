import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Facebook, Twitter, Instagram, Github, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-secondary/30 text-foreground border-t">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="space-y-6">
            <Link href="/" className="text-2xl font-bold flex items-center gap-2">
              <span className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-bold">V</span>
              Vyanix
            </Link>
            <p className="text-muted-foreground leading-relaxed">
              Experience the future of commerce. Vyanix offers a curated selection of premium electronics and timeless fashion.
            </p>
            <div className="flex gap-4">
              <Button variant="outline" size="icon" className="rounded-full border-muted-foreground/20">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full border-muted-foreground/20">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full border-muted-foreground/20">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full border-muted-foreground/20">
                <Github className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-6 uppercase tracking-widest text-primary">Quick Links</h3>
            <ul className="space-y-4 text-muted-foreground">
              <li><Link href="/shop" className="hover:text-primary transition-colors">Shop All</Link></li>
              <li><Link href="/category/electronics" className="hover:text-primary transition-colors">Electronics</Link></li>
              <li><Link href="/category/fashion" className="hover:text-primary transition-colors">Fashion</Link></li>
              <li><Link href="/category/home" className="hover:text-primary transition-colors">Home & Living</Link></li>
              <li><Link href="/deals" className="hover:text-primary transition-colors">Special Deals</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-6 uppercase tracking-widest text-primary">Support</h3>
            <ul className="space-y-4 text-muted-foreground">
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors">FAQs</Link></li>
              <li><Link href="/shipping" className="hover:text-primary transition-colors">Shipping Policy</Link></li>
              <li><Link href="/returns" className="hover:text-primary transition-colors">Returns & Exchanges</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-bold mb-6 uppercase tracking-widest text-primary">Newsletter</h3>
            <p className="text-muted-foreground">
              Join the Vyanix community for exclusive early access and style tips.
            </p>
            <div className="flex gap-2">
              <Input 
                placeholder="Your email" 
                className="bg-white border-muted focus-visible:ring-primary" 
              />
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t mt-16 pt-8 text-center text-muted-foreground text-xs">
          <p>© {new Date().getFullYear()} Vyanix Store. Designed for excellence.</p>
        </div>
      </div>
    </footer>
  );
}