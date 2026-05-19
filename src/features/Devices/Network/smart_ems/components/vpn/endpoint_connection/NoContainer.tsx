import { Alert } from "../../Alert";


interface props {
  deviceId: string;
}

export function NoContainer({ deviceId }: props) {
  return (
    <Alert title="VPN container client is missing">
      <p className="text-muted-foreground text-sm">
        If you believe this is an error, please contact your division administrator and provide your device
        ID: <span className="text-primary">{deviceId}</span>.
      </p>
    </Alert>
  );
}
