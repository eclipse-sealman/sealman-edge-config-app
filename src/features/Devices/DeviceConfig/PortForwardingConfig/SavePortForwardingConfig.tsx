import Button from "@/components/Input/Button";
import { usePortForwardingConfig } from "./useContext";
import { useSavePortForwardingConfig } from "./useSavePortForwardingConfig";
import { toast } from "react-toastify";

export default function SavePortForwardingConfig({
  deviceId,
}: {
  deviceId: string;
}) {
  const { config } = usePortForwardingConfig();
  const mutation = useSavePortForwardingConfig();

  if (!config) return null;

  return (
    <Button
      onClick={() =>
        mutation.mutate(
          {
            params: {
              path: {
                device: deviceId,
              },
            },
            body: {
              rules:
                config.rules
                  ?.filter(
                    (r) =>
                      r.srcPort !== undefined &&
                      r.destPort !== undefined &&
                      r.destAddr &&
                      r.name.trim() !== ""
                  )
                  .map((r) => ({
                    name: r.name,
                    interface: r.interface as "lan1" | "lan2" | "lan3",
                    srcPort: r.srcPort!,
                    destAddr: r.destAddr!,
                    destPort: r.destPort!,
                  })) ?? null,
            },
          },
          {
            onSuccess: () => toast.success("Success: configuration successfully saved"),
            onError: () => toast.error("Error: the configuration could not be saved"),
          }
        )
      }
    >
      Save
    </Button>
  );
}
