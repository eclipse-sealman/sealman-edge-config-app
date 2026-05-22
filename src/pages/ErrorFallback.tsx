import { ExclamationTriangleIcon } from "@heroicons/react/24/outline"
import { NavLink } from "react-router-dom"

interface ErrorPageParams {
  error?: Error,
  componentStack?: string,
  resetError?: () => void
}


export default function ErrorFallback({ error }: ErrorPageParams) {
  return (
    <div className="h-full flex flex-col justify-center items-center">
      <ExclamationTriangleIcon className="h-12 w-12" />
      <div>An Error occured</div>
      <div>{error?.message}</div>

      <NavLink
        to={"/"}
        className={({ isActive }: { isActive: boolean }) => `px-3 py-2 text-sm font-medium ${isActive ? "underline" : "hover:text-vibrant-blue"}`}
        aria-current={false ? 'page' : undefined}
      >
        Go to starting page
      </NavLink>
    </div>
  )
}