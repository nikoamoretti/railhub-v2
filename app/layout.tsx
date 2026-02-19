import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Railhub - Free Rail Freight Directory",
  description: "Find transload, team track, and railcar storage facilities across North America. 11,000+ locations with railroad, capacity, and service details.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>
        {children}
      </body>
    </html>
  );
}
