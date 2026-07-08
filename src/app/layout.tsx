import "./globals.css";

export const metadata = {
  title: "Markas - Jogja Marketing",
  description: "Ruang kerja internal Jogja Marketing",
};

import { createClient } from "@/utils/supabase/server";
import { Header } from "@/components/Header";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let me = "User";
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single();
    me = profile?.name || user.email?.split('@')[0] || "User";
  }

  return (
    <html lang="id">
      <body>
        {user && <Header me={me} />}
        {children}
      </body>
    </html>
  );
}
