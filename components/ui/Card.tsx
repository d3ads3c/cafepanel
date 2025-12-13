"use client";
import { ReactNode } from "react";

type CardProps = {
  className?: string;
  children: ReactNode;
};

export function Card({ className, children }: CardProps) {
  return (
    <div className={(className ? className + " " : "") + "bg-white rounded-2xl border p-4"}>
      {children}
    </div>
  );
}

type CardHeaderProps = { className?: string; title?: ReactNode; subtitle?: ReactNode; actions?: ReactNode };
export function CardHeader({ className, title, subtitle, actions }: CardHeaderProps) {
  return (
    <div className={(className ? className + " " : "") + "flex items-center justify-between mb-3"}>
      <div>
        {title && <div className="text-sm font-semibold text-gray-800">{title}</div>}
        {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
      </div>
      {actions}
    </div>
  );
}


