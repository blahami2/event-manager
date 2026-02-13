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
    "inline-block rounded-lg font-semibold text-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    primary:
      "bg-indigo-600 text-white px-8 py-3 text-lg hover:bg-indigo-700 focus:ring-indigo-500",
    secondary:
      "text-indigo-600 px-6 py-2 text-sm hover:text-indigo-800 underline underline-offset-4 focus:ring-indigo-500",
  };

  return (
    <Link href={href} className={`${base} ${variants[variant]}`}>
      {children}
    </Link>
  );
}
