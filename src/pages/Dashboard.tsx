import "leaflet/dist/leaflet.css";
import { MapContainer } from "react-leaflet";
import { TileLayer } from "react-leaflet";
import { Marker } from "react-leaflet";
import { Popup } from "react-leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import L from "leaflet";
import DevicesHeader, {
  DeviceOnlineFilterStatus,
} from "../features/Devices/DevicesHeader";
import DevicesByCountry, {
  CountryDeviceInfoDict,
} from "../features/Devices/DevicesByCountry";
import { useEffect, useState } from "react";
import FilterDetails from "../features/Devices/FilterDetails";
import DeviceMapCard from "../features/Devices/DeviceMapCard";
import useGetDevices from "@/generated/edge-administration/hooks/useGetDevices/useGetDevices";

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

function LoadingIcon() {
  return (
    <div>
      <div id="wifi-loader">
        <svg className="circle-outer" viewBox="0 0 86 86">
          <circle className="back" cx="43" cy="43" r="40"></circle>
          <circle className="front" cx="43" cy="43" r="40"></circle>
          <circle className="new" cx="43" cy="43" r="40"></circle>
        </svg>
        <svg className="circle-middle" viewBox="0 0 60 60">
          <circle className="back" cx="30" cy="30" r="27"></circle>
          <circle className="front" cx="30" cy="30" r="27"></circle>
        </svg>
        <svg className="circle-inner" viewBox="0 0 34 34">
          <circle className="back" cx="17" cy="17" r="14"></circle>
          <circle className="front" cx="17" cy="17" r="14"></circle>
        </svg>
        <div className="text" data-text="loading"></div>
      </div>
    </div>
  );
}

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
    return (
      <div className="flex justify-center items-center h-screen">
        <p></p>
        <LoadingIcon></LoadingIcon>
      </div>
    );

  if (easEdgeDevices.isError) {
    console.error(easEdgeDevices.error);
    return <div>Error while fetching the data</div>;
  }

  const clearTableFilter = () => {
    setDeviceOnlineFilter(DeviceOnlineFilterStatus.All);
    setCountriesSelectedDict(undefined);
    setCountrySelectRefreshKey((key) => key + 1);
  };

  return (
    <>
      <div className="flex flex-row flex-wrap">
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
            <Popup
              minWidth={256}
              className="[&_.leaflet-popup-content-wrapper]:rounded-lg [&_.leaflet-popup-content]:m-3!"
            >
              <DeviceMapCard
                deviceId={item.name}
                customer={item.customer}
              />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  );
}
