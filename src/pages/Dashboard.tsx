import "leaflet/dist/leaflet.css";
import { MapContainer } from "react-leaflet";
import { TileLayer } from "react-leaflet";
import { Marker } from "react-leaflet";
import { Popup } from "react-leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import L from "leaflet";
import { edgeConfigApi } from "../api/edgeConfig/edgeConfigApi";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import Badge from "../components/Typography/Badge";
import { BadgeColor } from "../components/Typography/Badge";
import DevicesHeader, {
  DeviceOnlineFilterStatus,
} from "../features/Devices/DevicesHeader";
import DevicesByCountry, {
  CountryDeviceInfoDict,
} from "../features/Devices/DevicesByCountry";
import { useEffect, useState } from "react";
import FilterDetails from "../features/Devices/FilterDetails";
import useGetDevices from "@/generated/edge-administration/hooks/useGetDevices/useGetDevices";
import PageTitle from "@/components/Typography/PageTitle";
import { ErrorState, LoadingState } from "@/components/ui/page-state";
import { getErrorMessage } from "@/lib/errors";

const greenIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const blueIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
});
L.Marker.prototype.options.icon = DefaultIcon;

const initialPosition: any = [50.861483790914974, 10.332054985593048];

interface DeviceMarker {
  lat: number;
  lon: number;
  name: string;
  status: string;
  customer?: string;
  description?: string;
}

const deviceShouldBeDisplayed = (
  filterStatus: DeviceOnlineFilterStatus,
  iotEdgeRuntime: string,
  countryCode: string,
  countriesSelectedDict?: CountryDeviceInfoDict,
) => {
  let shouldBeDisplayed = false;
  if (filterStatus === DeviceOnlineFilterStatus.All) {
    shouldBeDisplayed = true;
  } else {
    shouldBeDisplayed =
      (filterStatus === DeviceOnlineFilterStatus.Online &&
        iotEdgeRuntime === "Connected") ||
      (filterStatus === DeviceOnlineFilterStatus.Offline &&
        iotEdgeRuntime !== "Connected");
  }

  if (!shouldBeDisplayed) {
    return false;
  }

  if (countriesSelectedDict) {
    shouldBeDisplayed =
      countriesSelectedDict[countryCode].selected &&
      (countriesSelectedDict[countryCode].countryFilterStatus ===
        DeviceOnlineFilterStatus.All ||
        (countriesSelectedDict[countryCode].countryFilterStatus ===
          DeviceOnlineFilterStatus.Online &&
          iotEdgeRuntime === "Connected") ||
        (countriesSelectedDict[countryCode].countryFilterStatus ===
          DeviceOnlineFilterStatus.Offline &&
          iotEdgeRuntime !== "Connected"));
  }

  return shouldBeDisplayed;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const easEdgeDevices = useGetDevices();

  const [deviceOnlineFilter, setDeviceOnlineFilter] = useState(
    DeviceOnlineFilterStatus.All,
  );
  const [markers, setMarkers] = useState<DeviceMarker[]>([]);
  const [countriesSelectedDict, setCountriesSelectedDict] = useState<
    CountryDeviceInfoDict | undefined
  >(undefined);

  const [missingGeolocationCount, setMissingGeolocationCount] = useState(0);
  const [filteredOutCount, setFilteredOutCount] = useState(0);
  const [countrySelectRefreshKey, setCountrySelectRefreshKey] = useState(0);

  useEffect(() => {
    const markersArray: DeviceMarker[] = [];

    let missingGeoLocation = 0;
    let filteredOut = 0;

    if (easEdgeDevices.data) {
      easEdgeDevices.data.forEach((device) => {
        if (!device.deviceMetadata.geoLocation?.value) {
          missingGeoLocation++;
        }

        const countryCodeValue = device.deviceMetadata.countryCode?.value;

        const countryCode =
          typeof countryCodeValue === "string"
            ? countryCodeValue
            : "UNASSIGNED";

        const displayDevice = deviceShouldBeDisplayed(
          deviceOnlineFilter,
          device.iotEdgeRuntime,
          countryCode,
          countriesSelectedDict,
        );

        if (!displayDevice) {
          filteredOut++;
        }

        const geoValue = device.deviceMetadata.geoLocation?.value as string;

        const [lat, lon] = geoValue
          ? geoValue.split(",").map((v) => v.trim())
          : [];

        const customerValue = device.deviceMetadata.customer?.value;

        if (lat && lon && displayDevice) {
          const latitude = Number(lat);
          const longitude = Number(lon);
          if (isNaN(latitude) || isNaN(longitude)) {
            missingGeoLocation++;
          } else {
            markersArray.push({
              lat: latitude,
              lon: longitude,
              name: device.deviceId,
              status: device.iotEdgeRuntime,
              customer:
                typeof customerValue === "string" ? customerValue : undefined,
              // The type for value from the API isn't string, but in practice it should always be a string or undefined, so we check the type before assigning to avoid runtime errors
              description: typeof device.deviceMetadata.description?.value === "string" ? device.deviceMetadata.description?.value : undefined,
            });
          }
        }
      });
    }

    setMarkers(markersArray);
    setMissingGeolocationCount(missingGeoLocation);
    setFilteredOutCount(filteredOut);
  }, [easEdgeDevices?.data, deviceOnlineFilter, countriesSelectedDict]);

  if (easEdgeDevices.isLoading)
    return <LoadingState label="Loading dashboard..." className="h-full" />;

  if (easEdgeDevices.isError) {
    console.error(easEdgeDevices.error);
    return (
      <ErrorState
        title="Could not load the dashboard"
        message={getErrorMessage(easEdgeDevices.error)}
        onRetry={() => easEdgeDevices.refetch()}
      />
    );
  }

  const clearTableFilter = () => {
    setDeviceOnlineFilter(DeviceOnlineFilterStatus.All);
    setCountriesSelectedDict(undefined);
    setCountrySelectRefreshKey((key) => key + 1);
  };

  return (
    <div className="h-full space-y-4 overflow-y-auto p-6">
      <PageTitle title="Dashboard" description="Where your devices are and whether they are online." />
      <div className="flex flex-row flex-wrap items-center gap-2 rounded-lg border bg-background px-2 py-1 shadow-xs">
        <DevicesHeader
          showGeolocationInfo
          missingGeolocationCount={missingGeolocationCount}
          deviceOnlineFilter={deviceOnlineFilter}
          setDeviceOnlineFilter={(value) => {
            setDeviceOnlineFilter(value);
            setCountriesSelectedDict(undefined);
            setCountrySelectRefreshKey((key) => key + 1);
          }}
        />
        <div className="p-2">
          <DevicesByCountry
            onSelectChanged={(countriesDict) =>
              setCountriesSelectedDict(countriesDict)
            }
            refreshKey={countrySelectRefreshKey}
          />
        </div>
        <div className="p-2">
          <FilterDetails
            totalRows={easEdgeDevices.data?.length ?? 0}
            filteredRows={(easEdgeDevices.data?.length ?? 0) - filteredOutCount}
            clearTableFilter={clearTableFilter}
          />
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border shadow-xs">
      <MapContainer center={initialPosition} zoom={5} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((item, index) => (
          <Marker
            key={index}
            icon={item.status === "Connected" ? greenIcon : blueIcon}
            position={[item.lat, item.lon]}
          >
            <Popup>
              <p onClick={() => navigate(`/devices/${item.name}`)}>
                Device-ID: {item.name}
                <br />
                Description: {item.description}
                <br />
                Customer: {item.customer}
              </p>
              <ConnectionStatusMini deviceId={item.name}></ConnectionStatusMini>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      </div>
    </div>
  );
}

interface ConnectionStatusData {
  iotEdgeRuntime: string;
  iotHub: string;
  sems: string;
  vpn: string;
}

export function ConnectionStatusMini({ deviceId }: { deviceId: string }) {
  const { isLoading, isError, data, error } = useQuery<
    ConnectionStatusData,
    Error
  >({
    queryKey: ["getConnectionStatus", deviceId],
    queryFn: () => edgeConfigApi.getConnectionStatus(deviceId),
  });

  if (isLoading)
    return (
      <div className="p-2 rounded-sm ring-1 ring-inset animate-pulse ring-gray-200">
        <div className="h-[40px] bg-slate-300 rounded-sm" />
      </div>
    );

  if (isError) return <div className="text-sm text-destructive">Could not load the status: {getErrorMessage(error)}</div>;

  if (!data) return null;

  return (
    <div>
      <Badge
        color={
          data.iotEdgeRuntime === "Connected"
            ? BadgeColor.Green
            : BadgeColor.Red
        }
      >
        Runtime
      </Badge>
      <Badge
        color={data.iotHub === "Connected" ? BadgeColor.Green : BadgeColor.Red}
      >
        IoTHub
      </Badge>
      <Badge
        color={data.sems === "Connected" ? BadgeColor.Green : BadgeColor.Red}
      >
        SmartEMS
      </Badge>
      {data.vpn !== undefined && (
        <Badge
          color={data.vpn === "Connected" ? BadgeColor.Green : BadgeColor.Red}
        >
          VPN
        </Badge>
      )}
    </div>
  );
}
