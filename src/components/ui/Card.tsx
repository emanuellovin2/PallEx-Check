import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export function Card({ children, className = "", noPadding, ...props }: CardProps) {
  return (
    <div
      className={[
        "bg-surface-800 border border-surface-700 rounded-2xl",
        noPadding ? "" : "p-4",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
