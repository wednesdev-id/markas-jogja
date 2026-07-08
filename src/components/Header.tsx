"use client";
import { C, lurikCSS } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signoutAction } from "@/app/actions";

export function Header({ me, stripe = 0 }: { me: string, stripe?: number }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const navs = [
    { id: "home", label: "Proyek", href: "/" },
    { id: "dash", label: "Dasbor", href: "/dashboard" },
    { id: "cal", label: "Kalender", href: "/calendar" },
    { id: "notes", label: "Catatan Umum", href: "/notes" },
    { id: "profile", label: "Profil", href: "/profile" },
  ];

  return (
    <header style={{ background: C.ink, color: "#fff", position: "sticky", top: 0, zIndex: 10 }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", minHeight: 48, gap: 24, overflowX: "auto" }}>
        <b style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 17, letterSpacing: "-0.02em" }}>Markas</b>
        <nav style={{ display: "flex", gap: 6 }}>
          {navs.map((n) => {
            const isActive = pathname === n.href || (n.href !== '/' && pathname?.startsWith(n.href));
            return (
              <Link key={n.id} href={n.href}
                style={{ background: isActive ? "rgba(255,255,255,0.15)" : "transparent", color: isActive ? "#fff" : "#9AA3B8",
                  border: "none", padding: "6px 14px", borderRadius: 8, fontSize: 13.5, fontWeight: isActive ? 700 : 500,
                  cursor: "pointer", transition: "all .2s", textDecoration: "none", whiteSpace: "nowrap" }}>
                {n.label}
              </Link>
            )
          })}
        </nav>
        <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#C7CFE2" }}>Halo, {me}</span>
          <button style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", padding: "4px 10px", borderRadius: 4, fontSize: 12, cursor: "pointer" }} onClick={async () => {
            await signoutAction();
            router.push("/login");
          }}>Keluar</button>
        </div>
      </div>
      <div style={{ height: 6, background: lurikCSS(stripe) }} />
    </header>
  );
}
