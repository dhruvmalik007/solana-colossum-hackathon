"use client";

import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { H1, Lead } from "./ui/typography";

export function LandingHero() {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-white p-8 md:p-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col gap-3 max-w-3xl">
          <div className="text-sm text-muted-foreground">Distribution markets</div>
          <H1>Solana DeFi Prediction Markets</H1>
          <Lead>
            A continuous distributional prediction marketplace. Discover markets, express beliefs as distributions, and trade via order book or AMM routing.
          </Lead>
          <div className="mt-2 flex gap-3">
            <a href="#markets"><Button size="sm">Explore markets</Button></a>
            <a href="/create"><Button variant="outline" size="sm">Create market</Button></a>
          </div>
        </div>
      </motion.div>
      <motion.div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }} />
    </div>
  );
}
