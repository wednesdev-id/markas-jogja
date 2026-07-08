import "./globals.css";
import { Suspense } from "react";
import { HeaderWrapper } from "@/components/HeaderWrapper";
import { Bricolage_Grotesque } from 'next/font/google';

const bricolage = Bricolage_Grotesque({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-bricolage'
});

export const metadata = {
  title: "Markas - Jogja Marketing",
  description: "Ruang kerja internal Jogja Marketing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={bricolage.variable}>
      <body>
        <Suspense fallback={<div style={{ height: 48, background: "#111" }} />}>
          <HeaderWrapper />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
