import { AxiosError } from "axios";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { ErrorState, LoadingState } from "@/components/ui/page-state";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WifiIcon } from "@heroicons/react/24/outline";
import { edgeConfigApi } from "../../../api/edgeConfig/edgeConfigApi";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
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
      return <LoadingState />

    if (isError)
      return <ErrorState title="Could not load the cellular config" message={getErrorMessage(error)} />

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
      } catch (error: unknown) {
        toast.error(`Could not save the cellular config: ${getErrorMessage(error)}`)
        return
      }
      toast.success("Cellular config saved. Activate the config to apply it.")
    };

    return (
      <div className="grid grid-cols-2 gap-2">
        {data.cellular && (
          <div className="space-y-2">
            <div className="flex flex-col gap-2">
              <div className="flex font-medium"><><WifiIcon className="w-6 mr-1" />Cellular</></div>
              <Label>State</Label>
              <Select
                value={formData.state}
                onValueChange={(value) => setFormData({ ...formData, state: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on">on</SelectItem>
                  <SelectItem value="off">off</SelectItem>
                </SelectContent>
              </Select>
              <Label>APN</Label>
              <Input
                type="text"
                name="apn"
                value={formData.apn}
                onChange={handleChange}
              />
              <Label>Pin</Label>
              <Input
                type="text"
                name="pin"
                value={formData.pin}
                onChange={handleChange}
              />
              <Label>Access Number</Label>
              <Input
                type="text"
                name="access_number"
                value={formData.access_number}
                onChange={handleChange}
              />
              <Label>Auth Method</Label>
              <Input
                type="text"
                name="auth_method"
                value={formData.auth_method}
                onChange={handleChange}
              />
              <Label>Username</Label>
              <Input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
              />
              <Label>Password</Label>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <GuardedButton
            permissionKey={PERMISSION_KEYS.DEVICE_NETWORK_WRITE}
            deviceId={deviceId}
            onClick={handleSubmit}>Apply Cellular</GuardedButton></div>
        )}
      </div>
    );
  }
