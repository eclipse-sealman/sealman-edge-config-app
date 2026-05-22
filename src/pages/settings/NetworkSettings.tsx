import { useEffect, useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { edgeConfigApi } from "@/api/edgeConfig/edgeConfigApi";

export type EndpointType = {
  name: string;
  description: string | null;
  defaultIP: string  | null;
};
export default function NetworkSettings() {

  type ServicePort = {
    deviceEndpointServiceName: string;
    description: string | null;
    defaultPort: string | null;
  };

  const [endpointTypes, setEndpointTypes] = useState<EndpointType[]>([]);
  const [servicePorts, setServicePorts] = useState<ServicePort[]>([]);

  const [loading, setLoading] = useState(true);

  const [endpointError, setEndpointError] = useState<string | null>(null);
  const [portError, setPortError] = useState<string | null>(null);

  const [newEndpointTypes, setNewEndpoint] = useState({
    name: "",
    description: "",
    defaultIP: ""
  });

  const [newServicePort, setNewServicePort] = useState({
    name: "",
    description: "",
    defaultPort: ""
  });

  const handleAddEndpoint = async () => {
    // -------- Validation --------
    if (!newEndpointTypes.name.trim()) {
      setEndpointError("Endpoint name is required");
      return;
    }
    const duplicate = endpointTypes.some(
      (e) => e.name.toLowerCase() === newEndpointTypes.name.trim().toLowerCase()
    );
    if (duplicate) {
      setEndpointError("Duplicate endpoint types are not allowed");
      return;
    }

    let defaultIP: string | null = null;
    if (newEndpointTypes.defaultIP) {
      const ip = newEndpointTypes.defaultIP.trim();

      const ipv4Regex =
        /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

      if (!ipv4Regex.test(ip)) {
        setEndpointError("Enter valid IP address (example: 192.168.0.1)");
        return;
      }
      defaultIP = ip;
    }

    // -------- Build Payload --------
    const updated: EndpointType[] = [
      ...endpointTypes,
      {
        name: newEndpointTypes.name.trim(),
        description: newEndpointTypes.description || null,
        defaultIP: defaultIP
      }
    ];

    try {
      await edgeConfigApi.saveEndpointTypes(updated);
      setEndpointTypes(updated);
      setNewEndpoint({
        name: "",
        description: "",
        defaultIP: ""
      });
      setEndpointError(null);
    } catch (err) {
      console.error(err);
      setEndpointError("Failed to save endpoint type");
    }
  };

  useEffect(() => {
    initNetworkSettings();
  }, []);

  const handleAddServicePort = async () => {
    if (!newServicePort.name.trim()) {
      setPortError("Service name is required");
      return;
    }

    const duplicate = servicePorts.some(
      (p) =>
        p.deviceEndpointServiceName.toLowerCase() ===
        newServicePort.name.trim().toLowerCase()
    );

    if (duplicate) {
      setPortError("Duplicate service names not allowed");
      return;
    }

    let defaultPort: string | null = null;

    if (newServicePort.defaultPort) {
      const portNum = Number(newServicePort.defaultPort);

      if (isNaN(portNum) || portNum < 0 || portNum > 65535) {
        setPortError("Default port must be between 0 and 65535");
        return;
      }

      defaultPort = String(portNum);
    }

    const newItem = {
      deviceEndpointServiceName: newServicePort.name.trim(),
      description: newServicePort.description || null,
      defaultPort: defaultPort
    };

    const updated = [...servicePorts, newItem];

    try {
      await edgeConfigApi.saveServicePorts(updated);

      setServicePorts(updated);

      setNewServicePort({
        name: "",
        description: "",
        defaultPort: ""
      });

      setPortError(null);
    } catch (err) {
      console.error(err);
      setPortError("Failed to save service port");
    }
  };

  const handleDeleteServicePort = async (name: string) => {
    const updated = servicePorts.filter(
      (p) => p.deviceEndpointServiceName !== name
    );

    try {
      await edgeConfigApi.saveServicePorts(updated);
      setServicePorts(updated);
    } catch (err) {
      console.error(err);
      alert("Failed to delete service port");
    }
  };

  const initNetworkSettings = async () => {
    try {
      await loadNetworkSettings();
    } catch (err) {
      console.error("Network sync failed", err);
      setLoading(false);
    }
  };
  const loadNetworkSettings = async () => {
    try {
      const [endpointRes, portsRes] = await Promise.all([
        edgeConfigApi.getEndpointTypes(),
        edgeConfigApi.getServicePorts()
      ]);

      const types = endpointRes?.types ?? [];
      const ports = portsRes?.services ?? [];

      setEndpointTypes(types);
      setServicePorts(ports);
    } catch (err) {
      console.error("Failed to load network settings", err);
      setEndpointTypes([]);
      setServicePorts([]);
    } finally {
      setLoading(false);
    }
  };

  // -------- Loading Guard --------
  if (loading) {
    return <div>Loading network settings...</div>;
  }
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Network Settings</h2>

      <div className="flex flex-col gap-6">
        {/* Endpoint Types */}
        <div className="bg-card border rounded-lg p-4 space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Endpoint Types</h3>
          </div>

          {/* Existing Endpoint Types Table */}
          <div className="max-h-[350px] overflow-y-auto border rounded-md">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-background sticky top-0 z-20 shadow-xs">
                <tr className="bg-linear-to-r from-slate-100 to-slate-50 border-b">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground tracking-wide">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground tracking-wide">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground tracking-wide">
                    Default IP
                  </th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground tracking-wide">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="bg-background">
                {endpointTypes.map((item, index) => (
                  <tr key={index} className="border-b last:border-b-0">
                    <td className="p-3 font-medium">{item.name}</td>

                    <td className="p-3 text-muted-foreground">
                      {item.description || "-"}
                    </td>

                    <td className="p-3">{item.defaultIP || "-"}</td>

                    <td className="text-center">
                      <button
                        onClick={async () => {
                          const updated = endpointTypes.filter(
                            (endpoint) => endpoint.name !== item.name
                          );

                          try {
                            await edgeConfigApi.saveEndpointTypes(updated);

                            setEndpointTypes(updated);
                          } catch (err) {
                            console.error(err);
                            alert("Failed to delete endpoint type");
                          }
                        }}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add New Endpoint Table */}
          <div className="border rounded-md">
            <table className="w-full text-sm border-separate border-spacing-0 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-linear-to-r from-slate-100 to-slate-50 border-b">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground tracking-wide">
                    Name *
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground tracking-wide">
                    Description
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground tracking-wide">
                    Default IP
                  </th>

                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground tracking-wide">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr className="bg-background hover:bg-muted/40 transition-colors">
                  <td className="px-3 py-2">
                    <input
                      className="
  w-full px-3 py-2 rounded-md
  bg-muted/30
  border border-slate-200
  hover:border-slate-300
  focus:bg-background
  focus:border-primary
  focus:ring-2 focus:ring-primary/20
  outline-hidden
  transition
"
                      placeholder="Enter name"
                      value={newEndpointTypes.name}
                      onChange={(e) =>
                        setNewEndpoint({
                          ...newEndpointTypes,
                          name: e.target.value
                        })
                      }
                    />
                  </td>

                  <td className="px-3 py-2">
                    <input
                      className="
  w-full px-3 py-2 rounded-md
  bg-muted/30
  border border-slate-200
  hover:border-slate-300
  focus:bg-background
  focus:border-primary
  focus:ring-2 focus:ring-primary/20
  outline-hidden
  transition
"
                      placeholder="Optional"
                      value={newEndpointTypes.description}
                      onChange={(e) =>
                        setNewEndpoint({
                          ...newEndpointTypes,
                          description: e.target.value
                        })
                      }
                    />
                  </td>

                  <td className="px-3 py-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="eg. 192.168.0.1"
                      className="
  w-full px-3 py-2 rounded-md
  bg-muted/30
  border border-slate-200
  hover:border-slate-300
  focus:bg-background
  focus:border-primary
  focus:ring-2 focus:ring-primary/20
  outline-hidden
  transition
"
                      value={newEndpointTypes.defaultIP}
                      onChange={(e) =>
                        setNewEndpoint({
                          ...newEndpointTypes,
                          defaultIP: e.target.value
                        })
                      }
                    />
                  </td>

                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={handleAddEndpoint}
                      className="
            inline-flex items-center gap-1
            px-4 py-2 rounded-md
            bg-primary/10 text-primary
            hover:bg-primary hover:text-white
            transition-all
            font-medium
            shadow-xs
          "
                    >
                      <PlusIcon className="w-4 h-4 mr-1 inline" />Add
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Add Button */}
          <div className="flex flex-col gap-2">
            {endpointError && (
              <p className="text-sm text-destructive">{endpointError}</p>
            )}
          </div>
        </div>

        {/* Service Ports */}

        <div className="bg-card border rounded-lg p-4 space-y-4">
          <h3 className="text-lg font-semibold">Service Ports</h3>

          {/* Existing Services */}

          <div className="border rounded-md">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-linear-to-r from-slate-100 to-slate-50 border-b">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Default Port
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {servicePorts.map((item, index) => (
                  <tr key={index} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-medium">
                      {item.deviceEndpointServiceName}
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {item.description || "-"}
                    </td>

                    <td className="px-4 py-3">{item.defaultPort ?? "-"}</td>

                    <td className="text-center">
                      <button
                        onClick={() =>
                          handleDeleteServicePort(
                            item.deviceEndpointServiceName
                          )
                        }
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add New Service Port Table */}

          <div className="border rounded-md">
            <table className="w-full text-sm border-separate border-spacing-0 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-linear-to-r from-slate-100 to-slate-50 border-b">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground tracking-wide">
                    Name *
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground tracking-wide">
                    Description
                  </th>

                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground tracking-wide">
                    Default Port
                  </th>

                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground tracking-wide">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr className="bg-background hover:bg-muted/40 transition-colors">
                  <td className="px-3 py-2">
                    <input
                      placeholder="Service name"
                      className="
              w-full px-3 py-2 rounded-md
              bg-muted/30
              border border-slate-200
              hover:border-slate-300
              focus:bg-background
              focus:border-primary
              focus:ring-2 focus:ring-primary/20
              outline-hidden
              transition
            "
                      value={newServicePort.name}
                      onChange={(e) =>
                        setNewServicePort({
                          ...newServicePort,
                          name: e.target.value
                        })
                      }
                    />
                  </td>

                  <td className="px-3 py-2">
                    <input
                      placeholder="Optional"
                      className="
              w-full px-3 py-2 rounded-md
              bg-muted/30
              border border-slate-200
              hover:border-slate-300
              focus:bg-background
              focus:border-primary
              focus:ring-2 focus:ring-primary/20
              outline-hidden
              transition
            "
                      value={newServicePort.description}
                      onChange={(e) =>
                        setNewServicePort({
                          ...newServicePort,
                          description: e.target.value
                        })
                      }
                    />
                  </td>

                  <td className="px-3 py-2">
                    <input
                      type="number"
                      placeholder="eg. 502"
                      className="
              w-full px-3 py-2 rounded-md
              bg-muted/30
              border border-slate-200
              hover:border-slate-300
              focus:bg-background
              focus:border-primary
              focus:ring-2 focus:ring-primary/20
              outline-hidden
              transition
            "
                      value={newServicePort.defaultPort}
                      onChange={(e) =>
                        setNewServicePort({
                          ...newServicePort,
                          defaultPort: e.target.value
                        })
                      }
                    />
                  </td>

                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={handleAddServicePort}
                      className="
              inline-flex items-center gap-1
              px-4 py-2 rounded-md
              bg-primary/10 text-primary
              hover:bg-primary hover:text-white
              transition-all
              font-medium
              shadow-xs
            "
                    >
                      <PlusIcon className="w-4 h-4 mr-1 inline" />Add
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {portError && <p className="text-sm text-destructive">{portError}</p>}
        </div>
      </div>
    </div>
  );
}
