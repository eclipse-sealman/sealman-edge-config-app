import { AxiosError } from "axios";
import { useState, useEffect, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { ErrorState, LoadingState } from "@/components/ui/page-state";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InformationCircleIcon, WifiIcon } from "@heroicons/react/24/outline";
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

/** The device's cellular config; `data.cellular` says whether the device has a modem. */
export function useDeviceCellularConfig(deviceId: string | undefined) {
  return useQuery<InterfaceDataCellular, AxiosError>({
    queryKey: ['getDeviceCellularConfig', deviceId],
    queryFn: () => edgeConfigApi.getDeviceCellularConfig(deviceId),
    staleTime: Infinity,  // We don't want to refetch the form data
  });
}


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
    const { isPending, isError, data, error } = useDeviceCellularConfig(deviceId);

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

    const handleSubmit = async (ev: FormEvent<HTMLFormElement>) => {
      ev.preventDefault();
      try {
        await edgeConfigApi.postDeviceCellularConfig(deviceId, formData)
      } catch (error: unknown) {
        toast.error(`Could not save the cellular config: ${getErrorMessage(error)}`)
        return
      }
      toast.success("Cellular config saved. Activate the config to apply it.")
    };

    if (!data.cellular) {
      return (
        <div className="flex gap-2 rounded-md border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
          <InformationCircleIcon className="h-5 w-5 shrink-0" />
          <p>This device has no cellular interface.</p>
        </div>
      );
    }

    const fields = [
      { name: "apn", label: "APN" },
      { name: "pin", label: "Pin" },
      { name: "access_number", label: "Access Number" },
      { name: "auth_method", label: "Auth Method" },
      { name: "username", label: "Username" },
      { name: "password", label: "Password", type: "password" },
    ] as const;

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-6 rounded-lg border bg-background p-5">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground"><WifiIcon className="h-5 w-5" /></span>
              <h3 className="text-base font-semibold leading-none tracking-tight">Cellular</h3>
            </div>

            <div className="space-y-1.5">
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
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.name} className="space-y-1.5">
                  <Label htmlFor={`cellular-${field.name}`}>{field.label}</Label>
                  <Input
                    id={`cellular-${field.name}`}
                    type={"type" in field ? field.type : "text"}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <GuardedButton permissionKey={PERMISSION_KEYS.DEVICE_NETWORK_WRITE} deviceId={deviceId} type="submit">
            Save
          </GuardedButton>
        </div>
      </form>
    );
  }
