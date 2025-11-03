"use client";

import * as React from "react";

/**
 * Footer
 * Simple footer with links and muted gradient background, matching shadcn style.
 */
export function Footer(): React.ReactElement {
  const links: { label: string; href: string }[] = [
    { label: "Docs", href: "/docs" },
    { label: "Markets", href: "/#markets" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Contact", href: "mailto:support@example.com" },
  ];
  return (
    <footer className="rounded-2xl border p-6 bg-gradient-to-b from-background to-muted/60">
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="text-sm text-muted-foreground">© {new Date().getFullYear()} Distribution Markets</div>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-foreground">
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
