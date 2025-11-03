"use client";

import * as React from "react";

/**
 * Customers
 * Simple trusted-by section showing a logo grid. Replace image sources with your own.
 */
export function Customers(): React.ReactElement {
  const logos = [
    { alt: "Pyth", src: "https://cdn.magicui.design/companies/Google.svg" },
    { alt: "Chainlink", src: "https://cdn.magicui.design/companies/Microsoft.svg" },
    { alt: "Switchboard", src: "https://cdn.magicui.design/companies/Amazon.svg" },
    { alt: "Metaculus", src: "https://cdn.magicui.design/companies/Netflix.svg" },
  ];
  return (
    <section className="rounded-2xl border bg-white p-6">
      <div className="text-xs text-muted-foreground">TRUSTED BY</div>
      <div className="mt-4 grid grid-cols-2 gap-6 md:grid-cols-4">
        {logos.map((l) => (
          <div key={l.alt} className="flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity">
            <img src={l.src} alt={l.alt} className="h-6" />
          </div>
        ))}
      </div>
    </section>
  );
}
