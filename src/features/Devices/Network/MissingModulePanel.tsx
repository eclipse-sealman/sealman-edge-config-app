import React from "react";
import { CenteredAlertPanel } from "@/components/ui/centered-alert-panel";

type MissingModulePanelProps = {
  moduleName: string;
  className?: string;
};

export const MissingModulePanel: React.FC<MissingModulePanelProps> = ({
  moduleName,
  className = "",
}) => {
  return (
    <CenteredAlertPanel title="Missing module" variant="warning" className={className}>
      Module "{moduleName}" is required for this functionality.
    </CenteredAlertPanel>
  );
};
