import { Button } from "@/components/ui/button";

interface Props {
  readonly ip: string | undefined;
  readonly port: string | number;
  readonly disabled?: boolean;
}

export default function EdgeDeviceServiceBrowse({ ip, port, disabled = true }: Props) {
  const handleOnClick = () => {
    const url = `http://${ip}:${port}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Button variant="outline" onClick={handleOnClick} disabled={disabled || !ip}>
      Browse
    </Button>
  );
}
