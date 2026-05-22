import { Alert } from "../../Alert";

export function NotOnNetwork() {
  return (
    <Alert title="Endpoint not connected">
      The edge gateway is not reporting any connection from this endpoint.
      {/* TODO Sync 2/06: What to do in this case ? */}
    </Alert>
  );
}
