import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Railhub - Free Rail Freight Directory",
  description: "Find transload, team track, and railcar storage facilities across North America. 7,900+ locations with railroad, capacity, and service details.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
