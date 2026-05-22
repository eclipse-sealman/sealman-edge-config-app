import React from "react";

export enum BadgeColor {
  Gray = "bg-gray-50 text-gray-600 ring-gray-500/10",
  Red = "bg-red-50 text-red-700 ring-red-600/10",
  Yellow = "bg-yellow-50 text-yellow-800 ring-yellow-600/20",
  Green = "bg-green-50 text-green-700 ring-green-600/20",
  Blue = "bg-blue-50 text-blue-700 ring-blue-700/10",
  Indigo = "bg-indigo-50 text-indigo-700 ring-indigo-700/10",
  Purple = "bg-purple-50 text-purple-700 ring-purple-700/10",
  Pink = "bg-purple-50 text-purple-700 ring-pink-700/10"
}

interface BadgeProps {
  children: React.ReactNode
  color?: BadgeColor
  className?: string
}

export default function Badge({children, color, className}: BadgeProps) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-sm px-2 py-1 text-xs font-medium ring-1 ring-inset empty:hidden ${color || BadgeColor.Blue} ${className}`}>
      {children}
    </span>
  );
}