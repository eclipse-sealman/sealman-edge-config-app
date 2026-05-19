import { Alert } from "../Alert";

export function NotConnected() {
  return (
    <>
    <Alert title="Error while contacting SMART EMS">
      <p>There was an error contacting Smart EMS on your behalf.</p>
      <div className="text-muted-foreground">
        Have you already authorized Edge config to connect to Smart EMS on your behalf?
      </div>
    </Alert>
    </>
  )
}
