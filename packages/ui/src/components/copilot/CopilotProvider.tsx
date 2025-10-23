"use client";

import { ReactNode } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";

type Props = {
  children: ReactNode;
  publicApiKey?: string;
  runtimeUrl?: string;
};

export function CopilotProvider({ children, publicApiKey, runtimeUrl = "/api/copilotkit" }: Props) {
  return (
    <CopilotKit publicApiKey={publicApiKey} runtimeUrl={runtimeUrl}>
      {children}
    </CopilotKit>
  );
}
