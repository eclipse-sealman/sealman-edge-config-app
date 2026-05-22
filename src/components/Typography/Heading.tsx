import React, { ButtonHTMLAttributes, DetailedHTMLProps } from "react";
import Spinner from "../Misc/Spinner";

export enum HeadingColor {
  Gray = "bg-gray-500 text-white",
  Red = "bg-red-900 text-white",
  Yellow = "bg-yellow-900 text-white",
  Green = "bg-green-900 text-white",
  Blue = "bg-vibrant-blue text-white",
  Indigo = "bg-indigo-900 text-white",
  Purple = "bg-purple-900 text-white",
  Pink = "bg-purple-900 text-white"
}

interface HeadingProps {
  children: React.ReactNode
  color?: HeadingColor
  className?: string
  processing?: boolean
}

export function Heading({children, color, processing, className}: HeadingProps) {
  return (
    <div className={`flex w-full items-center rounded-sm px-2 py-1 text-xl font-medium empty:hidden ${color || HeadingColor.Gray} ${className}`}>
      {children}
      <Spinner className="ml-auto w-6 h-6" processing={processing} />
    </div>
  );
}

export function HeadingButton({children, className, ...props}: DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) {
  return <button className={`flex items-center hover:text-slate-200 ${className}`} {...props}>{children}</button>
}