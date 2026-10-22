import { useParams } from "react-router-dom";
import { WaterLoader } from "@/components/ui/water-loader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/errors";
import { edgeConfigApi } from "../../../api/edgeConfig/edgeConfigApi";
import { CMD_PROXY_MODULE_NAME } from "@/api/edgeConfig/moduleNames";
import { JSONTree } from "react-json-tree";
import { useState } from "react";
import {
  PrinterIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { withPermissionRequiredTooltip } from "@/features/authorization/permissions/withPermissionRequiredTooltip";
import { withPermissionAndModuleRequiredTooltip } from "@/features/authorization/permissions/withPermissionAndModuleRequiredTooltip";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";

const theme = {
  scheme: "monokai",
  base00: "#272822",
  base01: "#383830",
  base02: "#49483e",
  base03: "#75715e",
  base04: "#a59f85",
  base05: "#f8f8f2",
  base06: "#f5f4f1",
  base07: "#f9f8f5",
  base08: "#f92672",
  base09: "#fd971f",
  base0A: "#f4bf75",
  base0B: "#a6e22e",
  base0C: "#a1efe4",
  base0D: "#66d9ef",
  base0E: "#ae81ff",
  base0F: "#cc6633",
};

const PermissionGuardedButton = withPermissionRequiredTooltip(Button);
const PermissionAndModuleGuardedButton = withPermissionAndModuleRequiredTooltip(Button);

export function DeviceSemsConfigExport() {
  const { deviceId } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jsonData, setJsonData] = useState(null);
  const [configType, setConfigType] = useState("");

  // export SEMS config (no SEMS device config included)
  const { mutate: exportConfig, isPending: isExporting } = useMutation({
    mutationFn: async () => {
      setConfigType("sems");
      const response = await edgeConfigApi.getSmartEmsConfigExport(deviceId);
      return response;
    },

    onError: (error: unknown) => {
      toast.error(`Could not generate the config export: ${getErrorMessage(error)}`);
    },

    onSuccess: (resp: any) => {
      setJsonData(resp);
      setIsModalOpen(true);
    },
  });

  // load device config from physical device (SEMS device config included)
  const { mutate: loadConfig, isPending: isLoadingConfig } = useMutation({
    mutationFn: async () => {
      setConfigType("device");
      let resp = await edgeConfigApi.getDeviceCmdStatus(deviceId);
      if (resp.moduleStatus === "Disconnected") {
        toast.warning(
          `This action requires a connected '${CMD_PROXY_MODULE_NAME}' module. Check Applications.`
        );
      } else {
        resp = await edgeConfigApi.getDeviceCmdConfigShow(deviceId);
        return resp;
      }
    },

    onError: (error: unknown) => {
      toast.error(`Could not load the config from the device: ${getErrorMessage(error)}`);
    },

    onSuccess: (resp: any) => {
      setJsonData(resp);
      setIsModalOpen(true);
    },
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
    toast.success("JSON copied to clipboard");
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${deviceId}-config.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-2">
      <PermissionGuardedButton
        deviceId={deviceId}
        permissionKey={PERMISSION_KEYS.DEVICE_READ}
        variant="outline"
        disabled={isExporting}
        onClick={() => exportConfig()}
      >
        {isExporting && <WaterLoader />}
        Show desired Config
      </PermissionGuardedButton>
      <PermissionAndModuleGuardedButton
          deviceId={deviceId}
          permissionKey={PERMISSION_KEYS.DEVICE_READ}
          requiredModuleName={CMD_PROXY_MODULE_NAME}
          variant="outline"
          disabled={isLoadingConfig}
          onClick={() => loadConfig()}
        >
          {isLoadingConfig && <WaterLoader />}
          Show active Config
        </PermissionAndModuleGuardedButton>
      <Dialog open={Boolean(jsonData) && isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {configType === "sems"
                ? "Desired Device Configuration"
                : "Deployed Device Configuration"}
            </DialogTitle>
            <DialogDescription className="sr-only">Device configuration as JSON</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <PrinterIcon />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <ArrowDownTrayIcon />
              Download
            </Button>
          </div>
          <div className="max-h-96 overflow-auto">
            {jsonData && <JSONTree data={jsonData} theme={theme} />}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
