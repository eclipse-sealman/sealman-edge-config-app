import { useEffect, useState } from "react";
import Badge, { BadgeColor } from "../../components/Typography/Badge";
import { CountryDeviceInfoDict } from "./DevicesByCountry";
import useGetDevices from "@/generated/edge-administration/hooks/useGetDevices/useGetDevices";

export interface DevicesHeaderProps {
  showGeolocationInfo?: boolean;
  missingGeolocationCount?: number;
  deviceOnlineFilter: DeviceOnlineFilterStatus;
  setDeviceOnlineFilter: (status: DeviceOnlineFilterStatus) => void;
  onSelectCountriesChanged?: (selectedCountryDevices: CountryDeviceInfoDict) => void;
}

export enum DeviceOnlineFilterStatus {
  All = "ALL",
  Online = "ONLINE",
  Offline = "OFFLINE",
}

export default function DevicesHeader({
  showGeolocationInfo = false,
  missingGeolocationCount = 0,
  deviceOnlineFilter,
  setDeviceOnlineFilter,
}: DevicesHeaderProps) {
  const { data, isSuccess } = useGetDevices();

  const [totalCount, setTotalCount] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (isSuccess) {
      setTotalCount(data.length);
      setOnlineCount(data.filter((x) => x.iotEdgeRuntime === "Connected").length);
    }
  }, [isSuccess, data]);

  if (!isSuccess) {
    return null;
  }

  return (
    <div className="flex flex-row p-2 gap-2">
      <div className="flex-0" onClick={() => setDeviceOnlineFilter(DeviceOnlineFilterStatus.All)}>
        <Badge color={BadgeColor.Blue} className="cursor-pointer">
          {totalCount} Devices
        </Badge>
      </div>
      <div
        className="flex-0"
        onClick={() =>
          setDeviceOnlineFilter(
            deviceOnlineFilter !== DeviceOnlineFilterStatus.Online
              ? DeviceOnlineFilterStatus.Online
              : DeviceOnlineFilterStatus.All
          )
        }
      >
        <Badge
          color={BadgeColor.Green}
          className={`cursor-pointer ${
            deviceOnlineFilter === DeviceOnlineFilterStatus.Online ? "ring-green-700 font-bold! " : ""
          }`}
        >
          {onlineCount} Online
        </Badge>
      </div>
      <div
        className="flex-0"
        onClick={() =>
          setDeviceOnlineFilter(
            deviceOnlineFilter !== DeviceOnlineFilterStatus.Offline
              ? DeviceOnlineFilterStatus.Offline
              : DeviceOnlineFilterStatus.All
          )
        }
      >
        <Badge
          color={BadgeColor.Red}
          className={`cursor-pointer ${
            deviceOnlineFilter === DeviceOnlineFilterStatus.Offline ? "ring-red-700 font-bold! " : ""
          }`}
        >
          {totalCount - onlineCount} Offline
        </Badge>
      </div>
      {showGeolocationInfo ? (
        <div className="flex-0">
          <Badge color={BadgeColor.Gray}>{missingGeolocationCount} Missing Geolocation</Badge>
        </div>
      ) : null}
    </div>
  );
}
