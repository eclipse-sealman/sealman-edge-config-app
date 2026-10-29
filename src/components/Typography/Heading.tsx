import React, { ButtonHTMLAttributes, DetailedHTMLProps } from "react";
import Spinner from "../Misc/Spinner";

export enum HeadingColor {
  Gray = "text-slate-500 border-slate-100 [&>svg]:text-slate-400",
  Red = "text-red-700 border-red-100 [&>svg]:text-red-500",
  Yellow = "text-yellow-700 border-yellow-100 [&>svg]:text-yellow-500",
  Green = "text-green-700 border-green-100 [&>svg]:text-green-500",
  Blue = "text-vibrant-blue border-blue-100 [&>svg]:text-vibrant-blue",
  Indigo = "text-indigo-700 border-indigo-100 [&>svg]:text-indigo-500",
  Purple = "text-purple-700 border-purple-100 [&>svg]:text-purple-500",
  Pink = "text-purple-700 border-purple-100 [&>svg]:text-purple-500"
}

interface HeadingProps {
  children: React.ReactNode
  color?: HeadingColor
  className?: string
  processing?: boolean
}

export function Heading({children, color, processing, className}: HeadingProps) {
  return (
    <div className={`flex w-full items-center gap-2 border-b px-1 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider [&>svg]:mr-0 [&>svg]:h-4 [&>svg]:w-4 empty:hidden ${color || HeadingColor.Gray} ${className ?? ""}`}>
      {children}
      <Spinner className="ml-auto w-6 h-6" processing={processing} />
    </div>
  );
}

export function HeadingButton({children, className, ...props}: DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) {
  return <button className={`ml-3 flex items-center gap-1.5 text-sm font-medium normal-case tracking-normal text-slate-600 hover:text-vibrant-blue [&_svg]:ml-0 [&_svg]:h-4 [&_svg]:w-4 ${className ?? ""}`} {...props}>{children}</button>
}