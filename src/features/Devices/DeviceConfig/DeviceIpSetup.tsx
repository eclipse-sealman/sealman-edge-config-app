import { AxiosError } from "axios";
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { InputLabel } from '../../../components/Input/InputLabel';
import { Input } from "../../../components/Input/FormElements";
import { CpuChipIcon, GlobeAltIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import Button from "../../../components/Input/Button";
import { edgeConfigApi } from "../../../api/edgeConfig/edgeConfigApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Heading } from "../../../components/Typography/Heading";
import { HeadingColor } from "../../../components/Typography/Heading";
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
    return <div>Loading...</div>

  if (isError)
    return <div>Error: {error.message} {JSON.stringify(error.response?.data, null, 4)}</div>

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
      toast.success(`Success: scheduled interface update on device ${deviceId} -> check config update flag`)
    },
    onError: (error: AxiosError) => {
      toast.error(`ERROR: Could not schedule interface config on device ${deviceId}. ${error.message} ${JSON.stringify(error.response?.data, null, 4)}`)
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
      <GuardedButton deviceId={deviceId} permissionKey={PERMISSION_KEYS.DEVICE_NETWORK_WRITE} type="submit" processing={isPending}>Save</GuardedButton>
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
      toast.error(`ERROR: Could not fetch network info for ${interfaceName}.`);
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


      <InputLabel>DHCP</InputLabel>
      <input
        type="checkbox"
        name="dhcp"
        checked={interfaceForm.interfaceConfig[interfaceName].dhcp}
        onChange={handleToggleChange}
      />

      <InputLabel>IP</InputLabel>
      <Input
        type="text"
        name="ip"
        value={interfaceForm.interfaceConfig[interfaceName].ip}
        onChange={handleFormChange}
        disabled={interfaceForm.interfaceConfig[interfaceName].dhcp}
      />

      <InputLabel>Subnet</InputLabel>
      <Input
        type="text"
        name="subnet"
        value={interfaceForm.interfaceConfig[interfaceName].subnet}
        onChange={handleFormChange}
        disabled={interfaceForm.interfaceConfig[interfaceName].dhcp}
      />

      <InputLabel>Gateway</InputLabel>
      <Input
        type="text"
        name="gw"
        value={interfaceForm.interfaceConfig[interfaceName].gw}
        onChange={handleFormChange}
        disabled={interfaceForm.interfaceConfig[interfaceName].dhcp}
      />

      <InputLabel>DNS</InputLabel>
      <Input
        type="text"
        name="dns"
        value={interfaceForm.interfaceConfig[interfaceName].dns}
        onChange={handleFormChange}
        disabled={interfaceForm.interfaceConfig[interfaceName].dhcp}
      />
      {isLoadingModal && (
        <div className="modal fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-4 rounded shadow-lg">
            <div className="flex items-center justify-center space-x-2">
              <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-blue-500"></div>
              <p>Requesting current network config...</p>
            </div>
          </div>
        </div>
      )}

      {moduleGuardMessage && !isLoadingModal && (
        <div className="modal fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-4 rounded shadow-lg max-w-md w-full">
            <p className="text-m">{moduleGuardMessage}</p>
            <div className="flex justify-end mt-4">
              <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={() => setModuleGuardMessage(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {modalData && !isLoadingModal && (
        <div className="modal fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-2 rounded shadow-lg inline-block">
            <div className="inline-block">
              <Heading color={HeadingColor.Gray}>
                <InformationCircleIcon className="w-7 h-7 mr-1" />
                Current Network of {interfaceName.toUpperCase()}
              </Heading>
            </div>
            <table className="border border-gray-400 table-auto w-full mt-2">
              <tbody>
              <tr className="border border-gray-300">
                  <td className="p-2 bg-gray-100"><strong>State:</strong></td>
                  <td className="p-2 bg-gray-200">{(modalData.interface_state === "active") ?
                    <Badge color={BadgeColor.Green}>ACTIVE</Badge> : <Badge color={BadgeColor.Yellow}>INACTIVE</Badge>}</td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="p-2 bg-gray-100"><strong>Mode:</strong></td>
                  <td className="p-2 bg-gray-200">{modalData.current_mode}</td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="p-2 bg-gray-100"><strong>IP:</strong></td>
                  <td className="p-2 bg-gray-200">{modalData.current_ip}</td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="p-2 bg-gray-100"><strong>Subnet:</strong></td>
                  <td className="p-2 bg-gray-200">{modalData.current_subnet}</td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="p-2 bg-gray-100"><strong>Gateway:</strong></td>
                  <td className="p-2 bg-gray-200">{modalData.current_gateway}</td>
                </tr>
                <tr className="border border-gray-300">
                  <td className="p-2 bg-gray-100"><strong>DNS:</strong></td>
                  <td className="p-2 bg-gray-200">
                    {typeof modalData.current_dns === "string"
                      ? modalData.current_dns
                      : <ul>{modalData.current_dns.map((ip, index) => <li key={index}  className="border-b border-gray-300 last:border-0 py-1">{ip}</li>)}</ul>}
                  </td>
                </tr>
              </tbody>
            </table>
            <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded" onClick={() => setModalData(null)}>
              Close
            </button>
          </div>
        </div>
      )}


    </div>
  )
}
