import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: "Expediente 23-F — Documentos Desclasificados",
  description:
    "Exploración interactiva de los documentos desclasificados del intento de golpe de Estado del 23 de febrero de 1981 en España.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
