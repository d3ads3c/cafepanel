"use client";
import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'ghost' };

export default function Button({ variant='primary', className, ...rest }: Props) {
  const base = "rounded-xl px-4 py-2 text-sm transition active:scale-[.99] ";
  const styles = variant === 'primary'
    ? "bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
    : variant === 'outline'
      ? "border border-gray-300 text-gray-700 hover:bg-gray-50"
      : "text-gray-600 hover:bg-gray-100";
  return <button className={base + styles + (className ? " " + className : "")} {...rest} />;
}


