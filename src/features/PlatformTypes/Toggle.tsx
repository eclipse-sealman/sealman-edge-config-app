import { Switch } from "@/components/ui/switch";

export default function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange?: (val: boolean) => void;
  disabled?: boolean;
}) {
  return <Switch checked={checked} onCheckedChange={(val) => onChange?.(val)} disabled={disabled} />;
}
