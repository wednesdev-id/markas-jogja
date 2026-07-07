import "./globals.css";

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
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
