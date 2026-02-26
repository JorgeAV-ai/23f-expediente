import { MainNav } from "@/components/layout/main-nav";

export default function ExpedienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MainNav />
      <main className="pt-14">{children}</main>
    </>
  );
}
