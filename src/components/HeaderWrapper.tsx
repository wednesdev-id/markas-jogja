import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";

export async function HeaderWrapper() {
  const session = await auth();
  const user = session?.user;
  
  if (!user || !user.id) return null;
  
  let me = "User";
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true }
  });
  me = profile?.name || user.email?.split('@')[0] || "User";

  return <Header me={me} />;
}
