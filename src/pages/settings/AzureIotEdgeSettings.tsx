import PresetTemplateVariablesSettings from "./PresetTemplateVariablesSettings";
import AzureIotEdgeSwitch from "./AzureIotEdgeSwitch";
import BaseDeploymentSection from "./BaseDeploymentSection";
import { IOTEDGE_AGENT_VARIABLES, IOTEDGE_PROVISIONING_VARIABLES, IOTEDGE_REGISTRY_VARIABLES } from "./TemplatesSettings";
import { useIotHubInfo, usePlatformFunctions } from "@/features/PlatformFunctions/platformFunctionsApi";

function IotHubInfo() {
  const { data, isLoading } = useIotHubInfo();

  return (
    <div className="flex items-center justify-between gap-6 rounded-lg border bg-background px-6 py-4 shadow-xs">
      <div className="space-y-1">
        <p className="text-sm font-medium">IoT Hub</p>
        <p className="text-sm text-muted-foreground">Azure IoT Hub this platform is currently working with.</p>
      </div>
      <span className="font-mono text-sm">{isLoading ? "..." : (data?.hostname ?? "Not configured")}</span>
    </div>
  );
}

export default function AzureIotEdgeSettings() {
  const enabled = usePlatformFunctions().data?.azure_iot_edge_enabled ?? true;

  return (
    <PresetTemplateVariablesSettings
      title="Azure IoT Edge"
      description="Template variables used to provision the Azure IoT Edge runtime on devices. Empty fields fall back to the template default."
      header={
        <>
          <IotHubInfo />
          <AzureIotEdgeSwitch />
        </>
      }
      // Values already set on devices stay untouched; they are just not rendered while disabled.
      sections={
        enabled
          ? [
              {
                title: "Container Registry",
                description: "Registry from which the IoT Edge daemon pulls its containers.",
                variables: IOTEDGE_REGISTRY_VARIABLES,
              },
              {
                title: "Edge Agent",
                description: "Image of the IoT Edge agent started by the IoT Edge daemon.",
                variables: IOTEDGE_AGENT_VARIABLES,
              },
              {
                title: "IoT Edge DPS Provisioning",
                description: "ID scope of the Azure Device Provisioning Service used by devices with TPM (DPS) provisioning.",
                variables: IOTEDGE_PROVISIONING_VARIABLES,
              },
            ]
          : []
      }
    >
      {enabled && <BaseDeploymentSection />}
    </PresetTemplateVariablesSettings>
  );
}
