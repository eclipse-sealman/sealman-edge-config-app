import { AxiosError } from "axios";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { InputLabel } from '../../../components/Input/InputLabel';
import { Input, Select} from "../../../components/Input/FormElements";
import { WifiIcon } from "@heroicons/react/24/outline";
import { edgeConfigApi } from "../../../api/edgeConfig/edgeConfigApi";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Button from "../../../components/Input/Button";
import { withPermissionRequiredTooltip } from "@/features/authorization/permissions/withPermissionRequiredTooltip";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";


interface CellularConfig {
    apn: string
    pin: string
    access_number: string
    auth_method: string
    username: string
    password: string
    state: string
  }

  interface InterfaceDataCellular {
    cellular: boolean
    interface: CellularConfig
  }


  const GuardedButton = withPermissionRequiredTooltip(Button);


export function Cellular() {

    const [formData, setFormData] = useState({
      apn: "n",
      pin: "",
      access_number: "",
      auth_method: "",
      username: "",
      password: "",
      state: ""
    });
    const { deviceId } = useParams();
    const { isPending, isError, data, error } = useQuery<InterfaceDataCellular, AxiosError>({
      queryKey: ['getDeviceCellularConfig', deviceId],
      queryFn: () => edgeConfigApi.getDeviceCellularConfig(deviceId),
      staleTime: Infinity,  // We don't want to refetch the form data
    });

    useEffect(() => {
      if (!isPending && !isError && data) {
        if (data.cellular === true) {
          setFormData(data.interface);
        }

      }
    }, [isPending, isError, data]);


    if (isPending)
      return <div>Loading...</div>

    if (isError)
      return <div>Error: {error.message} {JSON.stringify(error.response?.data, null, 4)}</div>

    const handleChange = (e: any) => {
      const { name, value } = e.target;
      setFormData({
        ...formData,
        [name]: value,
      });
    };

    const handleSubmit = async () => {
      try {
        await edgeConfigApi.postDeviceCellularConfig(deviceId, formData)
        // const data = await response.json();
      } catch (error: any) {
        toast.error(`ERROR: Could not schedule interface config on device ${deviceId}. ${error.message} ${JSON.stringify(error.response?.data, null, 4)}`)
        return
      }
      toast.success(`Success: scheduled cellular update on device ${deviceId} -> check config update flag`)
    };

    return (
      <div className="grid grid-cols-2 gap-2">
        {data.cellular && (
          <div className="space-y-2">
            <div className="flex flex-col gap-2">
              <div className="flex font-medium"><><WifiIcon className="w-6 mr-1" />Cellular</></div>
              <InputLabel>State</InputLabel>
              <Select
                name="state"
                value={formData.state}
                onChange={handleChange}
              >
                <option value="on">on</option>
                <option value="off">off</option>
              </Select>
              <InputLabel>APN</InputLabel>
              <Input
                type="text"
                name="apn"
                value={formData.apn}
                onChange={handleChange}
              />
              <InputLabel>Pin</InputLabel>
              <Input
                type="text"
                name="pin"
                value={formData.pin}
                onChange={handleChange}
              />
              <InputLabel>Access Number</InputLabel>
              <Input
                type="text"
                name="access_number"
                value={formData.access_number}
                onChange={handleChange}
              />
              <InputLabel>Auth Method</InputLabel>
              <Input
                type="text"
                name="auth_method"
                value={formData.auth_method}
                onChange={handleChange}
              />
              <InputLabel>Username</InputLabel>
              <Input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
              />
              <InputLabel>Password</InputLabel>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <GuardedButton
            permissionKey={PERMISSION_KEYS.DEVICE_NETWORK_WRITE}
            resourceType="device"
            resourceId={deviceId}
            onClick={handleSubmit}>Apply Cellular</GuardedButton></div>
        )}
      </div>
    );
  }
