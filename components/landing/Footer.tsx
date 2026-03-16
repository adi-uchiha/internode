import { Icon } from '@iconify/react';
import { NEXT_PUBLIC_APP_NAME } from '@/lib/env';

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative w-6 h-6 border-2 border-foreground flex items-center justify-center transition-all duration-300 group-hover:border-primary group-hover:drop-shadow-[0_0_10px_hsl(var(--primary))]">
                <div className="w-2 h-2 bg-foreground" />
              </div>
              <span className="font-display font-semibold text-lg text-foreground tracking-tight uppercase">
                {NEXT_PUBLIC_APP_NAME}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Engineering management infrastructure for the next generation of high-performance
              teams. Architect your velocity.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display text-sm font-medium text-foreground mb-6 uppercase tracking-wider">
              Product
            </h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="#features"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Workflow
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="/compare/internode-vs-jira"
                  className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  Internode vs Jira
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-medium text-foreground mb-6 uppercase tracking-wider">
              Resources
            </h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  API Reference
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  System Status
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-medium text-foreground mb-6 uppercase tracking-wider">
              Legal
            </h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Privacy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Terms
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Security
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
            © {new Date().getFullYear()} {NEXT_PUBLIC_APP_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Icon icon="mdi:github" className="w-5 h-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Icon icon="mdi:twitter" className="w-5 h-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Icon icon="mdi:linkedin" className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
