import { MainNav } from "@/components/layout/main-nav";

export default function AcercaLayout({
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
