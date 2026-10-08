import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { OpcUaTreeBrowser } from "@/features/OPCUABrowser/OPCUATreeBrowser";

export default function OPCUABrrowserPage() {
  const [searchParams,] = useSearchParams();

  const endpoint = searchParams.get('endpoint');

  return (
    <>
      {endpoint ?
        <OpcUaTreeBrowser endpoint={endpoint} />
        :
        <EndpointForm />
      }
    </>
  )
}

function EndpointForm() {
  const [, setSearchParams] = useSearchParams();
  const [endpoint, setEndpoint] = useState("");

  const handleSubmit = () => {
    if (endpoint) {
      const search = {
        endpoint: endpoint
      }
      setSearchParams(search, { replace: true });
    }
  };

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-lg font-semibold leading-none tracking-tight">OPC UA Browser</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">Enter the endpoint of the OPC UA server to browse.</p>
      </div>
      <div className="bg-card border rounded-lg p-4 flex flex-col max-w-lg gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">OPCUA Endpoint</label>
          <Input
            type="text"
            name="endpoint"
            value={endpoint}
            placeholder="opc.tcp://i.p.v.4:4840"
            onChange={(ev: React.ChangeEvent<HTMLInputElement>) => setEndpoint(ev.target.value)}
          />
        </div>
        <Button className="self-start" onClick={handleSubmit} disabled={endpoint.length === 0}>Confirm</Button>
      </div>
    </div>
  )
}
