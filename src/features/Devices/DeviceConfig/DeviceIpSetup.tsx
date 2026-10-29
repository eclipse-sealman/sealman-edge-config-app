import { AxiosError } from "axios";
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { ErrorState, LoadingState } from "@/components/ui/page-state";
import { Input } from "@/components/ui/input";
import { CpuChipIcon, GlobeAltIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { WaterLoader } from "@/components/ui/water-loader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { edgeConfigApi } from "../../../api/edgeConfig/edgeConfigApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/errors";
import Badge, { BadgeColor } from "../../../components/Typography/Badge";
import { edgeConfigApiHooks } from "../../../api/edgeConfig/edgeConfigApiHooks";
import { CMD_PROXY_MODULE_NAME } from "@/api/edgeConfig/moduleNames";
import { InterfaceData, IpConfig } from "../../../api/edgeConfig/interfaces";
import { withPermissionRequiredTooltip } from "@/features/authorization/permissions/withPermissionRequiredTooltip";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";

interface NetworkInfo {
  interface_state: string;
  current_mode: string;
  current_ip: string;
  current_subnet: string;
  current_gateway: string;
  current_dns: string | Array<string>;
}

const removeNullFieldsFromIpConfig = (ipConf: IpConfig) => {
  if (!ipConf.ip) {
    delete ipConf.ip;
  }
  if (!ipConf.subnet) {
    delete ipConf.subnet;
  }
  if (!ipConf.gw) {
    delete ipConf.gw;
  }
  if (!ipConf.dns) {
    delete ipConf.dns;
  }
}

const GuardedButton = withPermissionRequiredTooltip(Button);

export default function DeviceIpSetup() {
  const { deviceId } = useParams();
  if (!deviceId) throw new Error("No deviceId provided in URL params")
  const { isPending, isError, data, error } = edgeConfigApiHooks.useGetSmartEmsConfigLan(deviceId);

  if (isPending)
    return <LoadingState />

  if (isError)
    return <ErrorState title="Could not load the interface config" message={getErrorMessage(error)} />

   // Putting the form into a child component is an easy way to make sure that data is not undefined
  return (
    <div>
      <InterfacesForm interfaceData={data!} />
    </div>
  )
}


/**
 * Displays multiple forms and a button to submit them
 */
function InterfacesForm({ interfaceData }: { interfaceData: InterfaceData }) {
  const [interfaceForm, setInterfaceForm] = useState<InterfaceData>(interfaceData);
  const { deviceId } = useParams();

  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation<any, AxiosError>({
    mutationFn: () => {
      const payload = {
        lan2: interfaceForm.interfaceConfig.lan2,
        lan3: interfaceForm.interfaceConfig.lan3
      }
      removeNullFieldsFromIpConfig(payload.lan2);
      removeNullFieldsFromIpConfig(payload.lan3);
      return edgeConfigApi.postSmartEmsConfigLan(deviceId, payload)
    },
    onSuccess: () => {
      toast.success("Interface config saved. Activate the config to apply it.")
    },
    onError: (error: AxiosError) => {
      toast.error(`Could not save the interface config: ${getErrorMessage(error)}`)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['getSmartEmsConfigLan', deviceId] });
    }
  });

  const handleSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    mutate();
  }

  const handleChange = (interfaceName: "lan1" | "lan2" | "lan3", name: string, value: string | boolean | null) => {
    console.log(value)
    if (value === ""){
      value = null
    }
    setInterfaceForm((prev) => {
      return {
        interfaceConfig: {
          ...prev.interfaceConfig,
          [interfaceName]: {
            ...prev.interfaceConfig[interfaceName],
            [name]: value
          }
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <InterfaceForm
          interfaceName="lan2"
          readableInterfaceName={<><GlobeAltIcon className="w-6 mr-1" />Lan-2 Internet</>}
          interfaceForm={interfaceForm}
          handleChange={handleChange} />
        <InterfaceForm
          interfaceName="lan3"
          readableInterfaceName={<><CpuChipIcon className="w-6 mr-1" />Lan-3 Machine Network</>}
          interfaceForm={interfaceForm}
          handleChange={handleChange} />
      </div>
      <GuardedButton deviceId={deviceId} permissionKey={PERMISSION_KEYS.DEVICE_NETWORK_WRITE} type="submit" disabled={isPending}>
        {isPending && <WaterLoader />}
        Save
      </GuardedButton>
    </form>
  )
}

interface InterfaceFormProps {
  interfaceName: keyof InterfaceData["interfaceConfig"]
  readableInterfaceName: React.ReactNode
  interfaceForm: InterfaceData
  handleChange: (interfaceName: keyof InterfaceData["interfaceConfig"], name: string, value: string | boolean) => void
}

function InterfaceForm({ interfaceForm, interfaceName, handleChange, readableInterfaceName }: InterfaceFormProps) {
  const { deviceId } = useParams();
  const [modalData, setModalData] = useState<NetworkInfo | null>(null);
  const [moduleGuardMessage, setModuleGuardMessage] = useState<string | null>(null);
  const [isLoadingModal, setIsLoadingModal] = useState(false);

  const handleFormChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = ev.target;
    handleChange(interfaceName, name, value);
  }

  const handleToggleChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = ev.target;
    handleChange(interfaceName, name, checked);
  }

  const handleInfoClick = async () => {
    setIsLoadingModal(true)
    try {
      const modules = await edgeConfigApi.getModules(deviceId);
      const cmdProxyModule = modules?.find((module: { moduleName: string; connectionState: string }) => module.moduleName === CMD_PROXY_MODULE_NAME);

      if (!cmdProxyModule) {
        setModuleGuardMessage(`This action requires module '${CMD_PROXY_MODULE_NAME}' to be installed on this device.`);
        return;
      }

      if (cmdProxyModule.connectionState !== "Connected") {
        setModuleGuardMessage(`This action requires module '${CMD_PROXY_MODULE_NAME}' to be connected on this device.`);
        return;
      }

      const data = await edgeConfigApi.getDeviceCmdNmConfig(deviceId);
      const networkInfo = data.network[interfaceName];

      let currentMode = "STATIC"
      if (networkInfo.dhcp){
        currentMode = "DHCP"
      }
      let interfaceState = "inactive"
      if (networkInfo.current_ip !== null){
        interfaceState = "active"
      }

      setModalData({
        interface_state: interfaceState,
        current_mode: currentMode,
        current_ip: networkInfo.current_ip || "N/A",
        current_subnet: networkInfo.current_subnet || "N/A",
        current_gateway: networkInfo.current_gateway || "N/A",
        current_dns: networkInfo.current_dns || "N/A"
      });
    } catch (error) {
      toast.error(`Could not load the network info for ${interfaceName}`);
    }
    finally {
      setIsLoadingModal(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">

      <div className="flex font-medium">
        {readableInterfaceName}
        <InformationCircleIcon className="w-5 h-5 ml-2 cursor-pointer" onClick={handleInfoClick} />
      </div>


      <Label>DHCP</Label>
      <input
        type="checkbox"
        name="dhcp"
        checked={interfaceForm.interfaceConfig[interfaceName].dhcp}
        onChange={handleToggleChange}
      />

      <Label>IP</Label>
      <Input
        type="text"
        name="ip"
        value={interfaceForm.interfaceConfig[interfaceName].ip}
        onChange={handleFormChange}
        disabled={interfaceForm.interfaceConfig[interfaceName].dhcp}
      />

      <Label>Subnet</Label>
      <Input
        type="text"
        name="subnet"
        value={interfaceForm.interfaceConfig[interfaceName].subnet}
        onChange={handleFormChange}
        disabled={interfaceForm.interfaceConfig[interfaceName].dhcp}
      />

      <Label>Gateway</Label>
      <Input
        type="text"
        name="gw"
        value={interfaceForm.interfaceConfig[interfaceName].gw}
        onChange={handleFormChange}
        disabled={interfaceForm.interfaceConfig[interfaceName].dhcp}
      />

      <Label>DNS</Label>
      <Input
        type="text"
        name="dns"
        value={interfaceForm.interfaceConfig[interfaceName].dns}
        onChange={handleFormChange}
        disabled={interfaceForm.interfaceConfig[interfaceName].dhcp}
      />
      {isLoadingModal && (
        <Dialog open>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="sr-only">Loading</DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                <WaterLoader className="h-5 w-5" />
                Requesting current network config...
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={Boolean(moduleGuardMessage) && !isLoadingModal} onOpenChange={(open) => !open && setModuleGuardMessage(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Action not available</DialogTitle>
            <DialogDescription>{moduleGuardMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setModuleGuardMessage(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(modalData) && !isLoadingModal} onOpenChange={(open) => !open && setModalData(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Current Network of {interfaceName.toUpperCase()}</DialogTitle>
            <DialogDescription className="sr-only">Current network configuration reported by the device</DialogDescription>
          </DialogHeader>
          {modalData && (
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">State</TableCell>
                  <TableCell>{(modalData.interface_state === "active") ?
                    <Badge color={BadgeColor.Green}>ACTIVE</Badge> : <Badge color={BadgeColor.Yellow}>INACTIVE</Badge>}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Mode</TableCell>
                  <TableCell>{modalData.current_mode}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">IP</TableCell>
                  <TableCell>{modalData.current_ip}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Subnet</TableCell>
                  <TableCell>{modalData.current_subnet}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Gateway</TableCell>
                  <TableCell>{modalData.current_gateway}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">DNS</TableCell>
                  <TableCell>
                    {typeof modalData.current_dns === "string"
                      ? modalData.current_dns
                      : <ul>{modalData.current_dns.map((ip, index) => <li key={index}>{ip}</li>)}</ul>}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
          <DialogFooter>
            <Button onClick={() => setModalData(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
