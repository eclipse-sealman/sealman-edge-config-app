import { useParams } from "react-router-dom";
import Button from "../../../components/Input/Button";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { edgeConfigApi } from "../../../api/edgeConfig/edgeConfigApi";
import { CMD_PROXY_MODULE_NAME } from "@/api/edgeConfig/moduleNames";
import { JSONTree } from "react-json-tree";
import { useState } from "react";
import {
  PrinterIcon,
  ArrowDownTrayIcon,
  WrenchScrewdriverIcon,
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

    onError: (error: any) => {
      toast.error(
        `ERROR: Could not generate config export: ${
          error.code
        } ${JSON.stringify(error.response?.data)}`
      );
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
          `this function require a connected <${CMD_PROXY_MODULE_NAME}> module -> check Module-Config`
        );
      } else {
        resp = await edgeConfigApi.getDeviceCmdConfigShow(deviceId);
        return resp;
      }
    },

    onError: (error: any) => {
      toast.error(
        `ERROR: Could not load config from device: ${
          error.code
        } ${JSON.stringify(error.response?.data)}`
      );
    },

    onSuccess: (resp: any) => {
      setJsonData(resp);
      setIsModalOpen(true);
    },
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
    toast.success("JSON copied to clipboard!");
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
    <div className="space-x-2">
      <PermissionGuardedButton
        deviceId={deviceId}
        permissionKey={PERMISSION_KEYS.DEVICE_READ}
        processing={isExporting}
        onClick={() => exportConfig()}
      >
        Show desired Config
      </PermissionGuardedButton>
      <PermissionAndModuleGuardedButton
          deviceId={deviceId}
          permissionKey={PERMISSION_KEYS.DEVICE_READ}
          requiredModuleName={CMD_PROXY_MODULE_NAME}
          processing={isLoadingConfig}
          onClick={() => loadConfig()}
        >
          Show active Config
        </PermissionAndModuleGuardedButton>
      {jsonData && isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-3/4 max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <WrenchScrewdriverIcon className="w-7 h-7 mr-1" />
              <strong>
                {configType === "sems"
                  ? "Desired Device Configuration"
                  : "Deployed Device Configuration"}
              </strong>

              <div className="ml-auto flex space-x-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center p-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  <PrinterIcon className="w-5 h-5 mr-1" />
                  Copy
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center p-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  <ArrowDownTrayIcon className="w-5 h-5 mr-1" />
                  Download
                </button>
              </div>
            </div>
            <div className="mb-4 max-h-96 overflow-auto">
              {jsonData && <JSONTree data={jsonData} theme={theme} />}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setIsModalOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
