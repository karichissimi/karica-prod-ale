"use client";

import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps extends Omit<LinkProps, "children" | "className"> {
  to: string; // Map 'to' to 'href'
  className?: string | ((props: { isActive: boolean; isPending: boolean }) => string);
  activeClassName?: string;
  pendingClassName?: string;
  children?: React.ReactNode | ((props: { isActive: boolean; isPending: boolean }) => React.ReactNode);
  end?: boolean; // Match exact
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, children, end, ...props }, ref) => {
    const pathname = usePathname();
    // Default matching logic: exact match if 'end' is true, otherwise startsWith
    // Note: React Router's default is prefix matching unless 'end' is true.
    // However, for root '/', we usually want exact match.
    // Let's mimic RR behavior:
    // If to="/" -> usually we want exact match if 'end' is set, OR if it's the root.
    // But standard RR <NavLink to="/"> matches everything. User code has `end` prop for root.

    // Simple logic:
    const isActive = end
      ? pathname === to
      : pathname === to || pathname.startsWith(to + "/");

    const isPending = false; // Next.js doesn't expose pending state for links easily here

    const computedClassName = typeof className === "function"
      ? className({ isActive, isPending })
      : cn(className as string, isActive && activeClassName);

    return (
      <Link
        ref={ref}
        href={to}
        className={computedClassName}
        {...props}
      >
        {typeof children === "function" ? children({ isActive, isPending }) : children}
      </Link>
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
