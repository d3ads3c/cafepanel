"use client";
import { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & { rightIcon?: React.ReactNode };

export default function Input({ className, rightIcon, ...rest }: Props) {
  return (
    <div className="relative">
      {rightIcon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{rightIcon}</div>}
      <input {...rest} className={(className ? className + " " : "") + "w-full rounded-xl border border-gray-300 bg-gray-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm"} />
    </div>
  );
}


