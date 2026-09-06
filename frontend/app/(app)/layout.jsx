"use client";

import Navbar from "@/components/Navbar";

export default function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}