"use client";
import { InputHTMLAttributes, forwardRef } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & { rightIcon?: React.ReactNode };

const Input = forwardRef<HTMLInputElement, Props>(({ className, rightIcon, ...rest }, ref) => {
  return (
    <div className="relative">
      {rightIcon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{rightIcon}</div>}
      <input 
        ref={ref}
        {...rest} 
        className={(className ? className + " " : "") + "w-full rounded-xl border border-gray-300 focus:outline-teal-500 p-3 text-sm"} 
      />
    </div>
  );
});

Input.displayName = "Input";

export default Input;


