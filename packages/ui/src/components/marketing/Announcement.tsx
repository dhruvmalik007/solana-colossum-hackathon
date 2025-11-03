"use client";

import * as React from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { AspectRatio } from "../ui/aspect-ratio";
import { H2 } from "../ui/typography";

/**
 * Announcement
 * Renders a top announcement bar with an optional call-to-action and an embedded YouTube video
 * with responsive aspect ratio. Designed for landing pages using shadcn/ui.
 *
 * Props:
 * - title: short announcement title
 * - ctaLabel: label for the call-to-action button
 * - ctaHref: link for the call-to-action button
 * - videoId: YouTube video ID to embed (e.g., "dQw4w9WgXcQ")
 */
export function Announcement({
  title = "Distributional Prediction Markets on Solana",
  ctaLabel = "Learn more",
  ctaHref = "/docs",
  videoId = "4yZKGbq1YmA",
}: {
  title?: string;
  ctaLabel?: string;
  ctaHref?: string;
  videoId?: string;
}): React.ReactElement {
  return (
    <section className="rounded-2xl border bg-white p-6 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Badge variant="secondary" className="h-6 rounded-full px-3">Announcement</Badge>
          <H2>{title}</H2>
        </div>
        <div>
          <a href={ctaHref}>
            <Button size="sm">{ctaLabel}</Button>
          </a>
        </div>
      </div>
      <Card className="mt-6">
        <CardContent className="p-0">
          <AspectRatio ratio={16/9}>
            <iframe
              className="absolute inset-0 h-full w-full rounded-b-2xl"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="Prediction Markets Overview"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </AspectRatio>
        </CardContent>
      </Card>
    </section>
  );
}
