"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

export function MarketTabs({
  defaultTab = "distribution",
  distribution,
  orderBook,
  activity,
  about,
  rulesAndEmbeds,
  discussion,
}: {
  defaultTab?: string;
  distribution: React.ReactNode;
  orderBook: React.ReactNode;
  activity: React.ReactNode;
  about: React.ReactNode;
  rulesAndEmbeds: React.ReactNode;
  discussion: React.ReactNode;
}) {
  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="distribution">Distribution</TabsTrigger>
        <TabsTrigger value="orderbook">Order Book</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="about">About</TabsTrigger>
        <TabsTrigger value="rules">Rules + Embeds</TabsTrigger>
        <TabsTrigger value="discussion">Discussion</TabsTrigger>
      </TabsList>
      <TabsContent value="distribution">{distribution}</TabsContent>
      <TabsContent value="orderbook">{orderBook}</TabsContent>
      <TabsContent value="activity">{activity}</TabsContent>
      <TabsContent value="about">{about}</TabsContent>
      <TabsContent value="rules">{rulesAndEmbeds}</TabsContent>
      <TabsContent value="discussion">{discussion}</TabsContent>
    </Tabs>
  );
}
