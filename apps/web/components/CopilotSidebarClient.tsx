"use client";

import dynamic from "next/dynamic";
import * as React from "react";

const Sidebar = dynamic(() => import("@copilotkit/react-ui").then(m => m.CopilotSidebar), {
  ssr: false,
});

export function CopilotSidebarClient(props: { labels?: { title?: string; initial?: string } }) {
  return <Sidebar {...props} />;
}
