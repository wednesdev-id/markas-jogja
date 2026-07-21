import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Profile } from "@/components/Profile";

export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user;

  if (!user || !user.id) {
    redirect("/login");
  }

  const profile = await prisma.user.findUnique({
    where: { id: user.id }
  });

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <Profile profile={profile} email={user.email || ""} />
    </div>
  );
}
