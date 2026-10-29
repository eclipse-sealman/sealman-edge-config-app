import { Outlet } from "react-router-dom";
import React from "react";

/**
 * Sidebar Layout: gets hidden on small screens
 */
export default function SidebarLayout({sidebar}: {sidebar: React.ReactNode}) {
  return (
    <div className="h-full flex gap-4 p-4">
      <div className="hidden 2xl:block w-72 shrink-0 overflow-y-auto rounded-lg border bg-white">
        {sidebar}
      </div>
      <div className="min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}