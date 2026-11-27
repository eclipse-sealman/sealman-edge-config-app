import type { components } from "@/generated/edge-administration/types";
import { passwordTimestamp } from "./passwordTimestamp";

type RenewalTask = NonNullable<components["schemas"]["DeviceSecretInformation"]["renewalTask"]>;

export default function PasswordRenewalStatus({ task }: { task: RenewalTask | null }) {
  if (!task) return null;
  if (task.status === "Pending") return <p className="text-sm">Automatic renewal scheduled around {passwordTimestamp(task.scheduledTime)}</p>;
  if (task.status === "Error") return <p role="alert" className="text-sm text-destructive">Automatic password renewal failed. Use Renew password to try again.</p>;
  return null;
}
