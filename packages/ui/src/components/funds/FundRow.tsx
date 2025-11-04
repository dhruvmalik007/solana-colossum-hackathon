"use client";
import * as React from "react";
import { Badge } from "@repo/ui/components/ui/badge";
import { TableRow, TableCell } from "@repo/ui/components/ui/table";

export type CreatorFund = {
  userId: string;
  walletAddress: string;
  role: "creator" | "participant" | "both";
  portfolioConnected: boolean;
  portfolioStats?: {
    solBalance?: number;
    tokenHoldings?: Array<{ mint: string; amount: number; decimals: number }>;
    nftCount?: number;
    totalMarketsCreated?: number;
    totalVolume?: number;
    successRate?: number;
    averageAccuracy?: number;
  };
  profileData?: { displayName?: string; bio?: string; website?: string; avatar?: string };
  verificationStatus: "pending" | "verified" | "rejected";
  createdAt: string;
  updatedAt: string;
};

function short(addr?: string) {
  if (!addr) return "";
  return addr.length > 10 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

export function FundRow({ item, onClick }: { item: CreatorFund; onClick?: () => void }) {
  const name = item.profileData?.displayName || short(item.walletAddress);
  const manager = item.profileData?.website || short(item.walletAddress);
  const totalDeposits = item.portfolioStats?.totalVolume ?? undefined;
  const currentBalance = item.portfolioStats?.solBalance ?? undefined;
  const profit = undefined; // not available yet

  return (
    <TableRow onClick={onClick} className={onClick ? "cursor-pointer" : undefined} aria-label={`Open ${name}`}>
      <TableCell className="font-medium">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-muted" aria-hidden />
          <div>
            <div className="truncate">{name}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Badge variant="secondary" className="rounded-full">{item.role}</Badge>
              <Badge variant={item.verificationStatus === "verified" ? "default" : "secondary"} className="rounded-full capitalize">
                {item.verificationStatus}
              </Badge>
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{manager}</TableCell>
      <TableCell>{typeof totalDeposits === "number" ? `$${totalDeposits.toLocaleString()}` : "—"}</TableCell>
      <TableCell>{typeof currentBalance === "number" ? `$${currentBalance.toLocaleString()}` : "—"}</TableCell>
      <TableCell>{profit === undefined ? "—" : profit}</TableCell>
    </TableRow>
  );
}
