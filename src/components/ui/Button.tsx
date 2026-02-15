import Link from "next/link";

interface ButtonProps {
  readonly href: string;
  readonly variant?: "primary" | "secondary";
  readonly children: React.ReactNode;
}

export function Button({
  href,
  variant = "primary",
  children,
}: ButtonProps): React.ReactElement {
  const base =
    "inline-block font-heading text-center uppercase tracking-wide transition-all duration-300";
  const variants = {
    primary:
      "bg-accent text-white px-10 py-[15px] text-2xl border-3 border-accent hover:bg-transparent hover:text-accent",
    secondary:
      "text-text-gray px-6 py-2 text-sm hover:text-accent underline underline-offset-4",
  };

  return (
    <Link href={href} className={`${base} ${variants[variant]}`}>
      {children}
    </Link>
  );
}
