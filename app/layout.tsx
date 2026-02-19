import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

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
      <body className="antialiased flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
