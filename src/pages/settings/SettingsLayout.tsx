import SectionLayout from "@/layouts/SectionLayout";
import { usePermissions } from "@/features/authorization/permissions/use-permissions";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";

const SETTINGS_TABS = [
  { label: "Global Device Settings", path: "devices" },
  { label: "UI-Styling", path: "appearance" },
  { label: "Platform Functions", path: "platform-functions" },
];

export default function SettingsLayout() {
  const { hasPermission } = usePermissions({ permissionKey: PERMISSION_KEYS.EXTENSION_READ });
  const tabs = hasPermission ? [...SETTINGS_TABS, { label: "Extensions", path: "extensions" }] : SETTINGS_TABS;
  return <SectionLayout tabs={tabs} />;
}
