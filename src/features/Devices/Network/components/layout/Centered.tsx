import { ReactNode } from "react"

interface props {
  children: ReactNode
}

export default function Centered({ children }: props) {
  return (
    <div className="sm:flex sm:flex-col sm:items-center sm:justify-center sm:grow h-full">
      {children}
    </div>
  )
}
