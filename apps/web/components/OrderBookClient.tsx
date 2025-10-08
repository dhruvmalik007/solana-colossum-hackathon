"use client";

import * as React from "react";
import { Tabs , TabsList , TabsTrigger , TabsContent } from "@repo/ui/components/ui/tabs";
import { Table , TableBody , TableCell , TableHead , TableHeader , TableRow } from "@repo/ui/components/ui/table";
import TVLChartClient, { TVLPoint } from "./TVLChartClient";

// React 19 interop casts

export default function OrderBookClient({ series }: { series: TVLPoint[] }) {
  return (
    <>
    <Tabs defaultValue="yes">
      <TabsList>
        <TabsTrigger value="yes">Trade Yes</TabsTrigger>
        <TabsTrigger value="no">Trade No</TabsTrigger>
        <TabsTrigger value="graph">Graph</TabsTrigger>
      </TabsList>
      <TabsContent value="yes">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="mb-2 text-sm font-semibold">Bids</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[{ price: "1.00", size: "1,000" }, { price: "0.98", size: "1,250" }, { price: "0.96", size: "1,500" }].map((o, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{o.price}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{o.size}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div>
            <div className="mb-2 text-sm font-semibold">Asks</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[{ price: "1.02", size: "900" }, { price: "1.04", size: "1,100" }, { price: "1.06", size: "1,300" }].map((o, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{o.price}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{o.size}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="no">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="mb-2 text-sm font-semibold">Bids</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[{ price: "0.40", size: "1,400" }, { price: "0.38", size: "1,200" }, { price: "0.36", size: "1,000" }].map((o, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{o.price}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{o.size}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div>
            <div className="mb-2 text-sm font-semibold">Asks</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[{ price: "0.42", size: "1,000" }, { price: "0.44", size: "1,300" }, { price: "0.46", size: "1,600" }].map((o, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{o.price}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{o.size}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="graph">
        <TVLChartClient data={series} />
      </TabsContent>
    </Tabs>
    </>
  );
}
