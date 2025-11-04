"use client";
import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table";
import { FundRow, type CreatorFund } from "@repo/ui/components/funds/FundRow";

export function FundTable({ items, onRowClick }: { items: CreatorFund[]; onRowClick?: (id: string) => void }) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fund</TableHead>
            <TableHead>Manager</TableHead>
            <TableHead className="text-right">Total Deposits</TableHead>
            <TableHead className="text-right">Current Balance</TableHead>
            <TableHead className="text-right">Total Profit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((it) => (
            <FundRow key={it.userId} item={it} onClick={onRowClick ? () => onRowClick(it.userId) : undefined} />
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                No funds found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
