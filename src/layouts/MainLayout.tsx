import NavigationBar from "../components/Navigation/NavigationBar";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="h-screen">
      <div className="h-[64px]">
        <NavigationBar />
      </div>
      <div className="h-[calc(100vh-64px)] bg-gray-200 border-t">
        <Outlet />
      </div>
    </div>
  )
}