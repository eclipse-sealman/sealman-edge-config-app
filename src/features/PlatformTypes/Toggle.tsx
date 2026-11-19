import { Switch } from "@/components/ui/switch";

export default function Toggle({
  checked,
  onChange,
  disabled = false,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onChange?: (val: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  return <Switch checked={checked} onCheckedChange={(val) => onChange?.(val)} disabled={disabled} aria-label={ariaLabel} />;
}
