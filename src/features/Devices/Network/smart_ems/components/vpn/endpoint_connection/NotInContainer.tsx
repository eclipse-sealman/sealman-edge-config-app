import { Alert } from "../../Alert";

export function NotInContainer() {

  return (
    <>
      <Alert title="Not correctly setup">
        <p>This endpoint is not part of the endpoint device list of the VPN container client.</p>
        <div>
          <p className="text-muted-foreground text-sm">
            If you believe this is an error, please contact your division administrator and provide them the
            endpoint details so they can decide to add the endpoint or not.
          </p>
        </div>
      </Alert>
    </>
  );
}
