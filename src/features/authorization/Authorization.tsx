import SectionLayout from "@/layouts/SectionLayout";

const AUTHORIZATION_TABS = [
  { label: "Users", path: "users" },
  { label: "Teams", path: "teams" },
  { label: "Roles", path: "roles" },
  { label: "Scopes", path: "scopes" },
];

export default function Authorization() {
  return <SectionLayout title="Authorization" tabs={AUTHORIZATION_TABS} />;
}
