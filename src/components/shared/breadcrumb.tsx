import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-8 font-typewriter text-xs uppercase tracking-[0.15em] text-muted-foreground"
    >
      {items.map((item, i) => (
        <span key={i}>
          {i > 0 && <span className="mx-2 text-border">&rsaquo;</span>}
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-amber">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
