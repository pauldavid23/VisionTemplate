import type { ComponentPropsWithoutRef } from "react";
import { Link } from "react-router";

type Variant = "default" | "outline" | "ghost" | "secondary";
type Size = "default" | "sm" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  default:
    "bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover active:bg-primary-deep",
  outline:
    "border border-input bg-background text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground",
  ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
};

const sizes: Record<Size, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-8 px-3 text-xs",
  lg: "h-12 px-8",
};

type BaseProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
};

function classes({
  variant = "default",
  size = "default",
  className = "",
}: BaseProps) {
  const shine = variant === "default" ? "shine" : "";
  return `${base} ${variants[variant]} ${sizes[size]} ${shine} ${className}`.trim();
}

type ButtonProps = BaseProps & ComponentPropsWithoutRef<"button">;
type LinkButtonProps = BaseProps & { to: string } & Omit<
    ComponentPropsWithoutRef<typeof Link>,
    "to" | "className"
  >;

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button className={classes({ variant, size, className })} {...props} />
  );
}

export function LinkButton({
  variant,
  size,
  className,
  to,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      to={to}
      className={classes({ variant, size, className })}
      {...props}
    />
  );
}
