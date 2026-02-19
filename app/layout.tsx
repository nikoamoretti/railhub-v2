import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Railhub - Free Rail Freight Directory",
  description: "Find transload and railcar storage facilities across the US",
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