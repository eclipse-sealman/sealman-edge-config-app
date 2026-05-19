import React from "react";
import { CenteredAlertPanel } from "@/components/ui/centered-alert-panel";

type NoPermissionsPanelProps = {
  children: React.ReactNode;
  className?: string;
};

export const NoPermissionsPanel: React.FC<NoPermissionsPanelProps> = ({
  children,
  className = "",
}) => {
  return (
    <CenteredAlertPanel title="Access Restricted" variant="danger" className={className}>
      {children}
    </CenteredAlertPanel>
  );
};
