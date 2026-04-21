import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Cyber Pulse POS",
  description: "Universal Pakistan POS with FBR-ready integration architecture."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
