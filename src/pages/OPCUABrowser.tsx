import { useSearchParams } from "react-router-dom";
//import OPCUABrowser from "../features/OPCUABrowser/OPCUABrowser";
import { Input } from "../components/Input/FormElements";
import { InputLabel } from "../components/Input/InputLabel";
import { useState } from "react";
import Button from "../components/Input/Button";
import { OpcUaTreeBrowser } from "@/features/OPCUABrowser/OPCUATreeBrowser";

export default function OPCUABrrowserPage() {
  const [searchParams,] = useSearchParams();

  const endpoint = searchParams.get('endpoint');

  return (
    <>
      {endpoint ?
        <OpcUaTreeBrowser moduleName="seal-module-opcua-client" endpoint={endpoint} />
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
    <div className="flex flex-col max-w-lg gap-2">
      <InputLabel>OPCUA Endpoint</InputLabel>
      <Input
        type="text"
        name="endpoint"
        value={endpoint}
        placeholder="opc.tcp//i.p.v.4:4840"
        onChange={(ev: React.ChangeEvent<HTMLInputElement>) => setEndpoint(ev.target.value)}
      />
      <Button onClick={handleSubmit} disabled={endpoint.length === 0}>Confirm</Button>
    </div>
  )
}
