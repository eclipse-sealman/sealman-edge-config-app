import { Outlet } from "react-router-dom";
import React from "react";

/**
 * Sidebar Layout: gets hidden on small screens
 */
export default function SidebarLayout({sidebar}: {sidebar: React.ReactNode}) {
  return (
    <div className="h-full grid grid-cols-6 gap-2 pt-2 border">
      <div className="hidden xl:block xl:col-span-1 border border overflow-y-auto">
        {sidebar}
      </div>
      <div className="col-span-6 xl:col-span-5 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}