import { AlertCircle, InfoIcon } from "lucide-react";

import { Alert as _Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ReactNode } from "react";

interface props {
  title: string;
  children: ReactNode;
}

export function Alert({ children, title }: props) {
  return (
    <_Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{children}</AlertDescription>
    </_Alert>
  );
}

export function Callout({ children, title }: props) {
  return (
    <>
      <_Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{children}</AlertDescription>
      </_Alert>
    </>
  )
}
