import { useMutation } from "@tanstack/react-query";
import Button from "../../../components/Input/Button";
import { edgeConfigApi } from "../../../api/edgeConfig/edgeConfigApi";
import { useParams } from "react-router-dom";
import { toast } from 'react-toastify';
import { useState } from 'react';
import Badge from "@/components/Typography/Badge";
import Select from "react-select";
import { InputLabel } from "@/components/Input/InputLabel";
import { OpcUaTreeBrowser } from "@/features/OPCUABrowser/OPCUATreeBrowser";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { withPermissionRequiredTooltip } from "@/features/authorization/permissions/withPermissionRequiredTooltip";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";

const GuardedButton = withPermissionRequiredTooltip(Button);

export default function DirectMethods({ moduleName }: { moduleName: string }) {

  return (
    <div className="grid grid-cols space-y-2 mt-2">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="module-restart">
          <AccordionTrigger className="text-l px-4 py-3 bg-blue-200 text-black transition-colors">RESTART</AccordionTrigger>
            <AccordionContent className="border shadow-sm p-6 bg-white grid grid-cols space-y-2 mt-2">
              <RestartModule moduleName={moduleName} />
            </AccordionContent>
        </AccordionItem>
        {moduleName.includes("opcua") &&
        <AccordionItem value="opcua">
          <AccordionTrigger className="text-l px-4 py-3 bg-blue-200 text-black transition-colors">OPCUA</AccordionTrigger>
            <AccordionContent className="border shadow-sm p-6 bg-white grid grid-cols space-y-2 mt-2">
              {moduleName.includes('seal-app-opcua-client') && <ReadNodeId moduleName={moduleName} />}
          </AccordionContent>
        </AccordionItem>
        }
        {moduleName.includes("opcua") &&
        <AccordionItem value="opcua-browser">
          <AccordionTrigger className="text-l px-4 py-3 bg-blue-200 text-black transition-colors">OPCUA Browser</AccordionTrigger>
            <AccordionContent className="border shadow-sm p-6 bg-white grid grid-cols space-y-2 mt-2">
              {moduleName.includes('seal-app-opcua-client') && <OpcUaTreeBrowser moduleName={moduleName} endpoint="opc.tcp://x.x.x.x:4840"/>}
          </AccordionContent>
        </AccordionItem>
        }
      </Accordion>
    </div>
  )
}

function RestartModule({ moduleName }: { moduleName: string }) {
  const { deviceId } = useParams();

  //edgeAgent and HedgeHub have leading $-signs which need to be removed for edgeAgents RestartModule method
  if (moduleName == "$edgeAgent"){
    moduleName = "edgeAgent"
  }
  if (moduleName == "$edgeHub"){
    moduleName = "edgeHub"
  }
  const { mutate } = useMutation({
    mutationFn: () => {
      const payload = {
        "methodName": "RestartModule",
        "methodPayload": {
          "schemaVersion": "1.0",
          "id": moduleName
        }
      }
      return edgeConfigApi.invokeDirectMethod(deviceId, "$edgeAgent", payload)
    },
    onSuccess: () => {
      toast.success(`Success: Module ${moduleName} restarted on Device ${deviceId}`)
    },
    onError: () => {
      // edgeAgent always throws an error -> also if it gets directly restarted from azure portal
      if (moduleName == "edgeAgent"){
        toast.info(`Restart of IoTEdge Runtime initiated on Device ${deviceId}`)
      }
      else{
        toast.error(`Error: Module ${moduleName} was not restarted on Device ${deviceId}`)
      }
    }
  })
  return <GuardedButton 
            resourceType="device" 
            resourceId={deviceId} 
            permissionKey={PERMISSION_KEYS.DEVICE_MODULE_EXECUTE_METHOD} 
            onClick={() => mutate()}>
              Restart Module
          </GuardedButton>
}


function ReadNodeId({ moduleName }: { moduleName: string }) {
  const { deviceId } = useParams();

  const [endpoint, setEndpoint] = useState("");
  const [endpointValid, setEndpointValid] = useState(true);

  const [nodeId, setNodeId] = useState("");

  const [credentialsType, setCredentialsType] = useState<"Anonymous" | "UserName" | "Certificate">("Anonymous");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [certificate, setCertificate] = useState("");
  const [privateKey, setPrivateKey] = useState("");

  const [messageSecurityMode, setMessageSecurityMode] = useState<"None" | "Sign" | "SignAndEncrypt">("None");
  const [securityPolicy, setSecurityPolicy] = useState<
    | "None"
    | "Basic128"
    | "Basic192"
    | "Basic256Rsa15"
    | "Basic256Sha256"
    | "Aes128_Sha256_RsaOaep"
    | "Aes256_Sha256_RsaPss"
    | "PubSub_Aes128_CTR"
    | "PubSub_Aes256_CTR"
    | "Basic128Rsa15"
    | "Basic256"
  >("None");

  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [formattedResult, setFormattedResult] = useState<string>("");
  const [opcuaStatusCode, setOpcuaStatusCode] = useState<number | null>(null);

  function validateEndpoint(value: string) {
    const regex = /^opc\.tcp:\/\/(\d{1,3}\.){3}\d{1,3}:\d{1,5}$/;
    if (!regex.test(value)) return false;

    const [, ip, portStr] = value.match(/^opc\.tcp:\/\/(.+):(\d{1,5})$/) || [];
    if (!ip || !portStr) return false;

    const parts = ip.split(".").map(Number);
    const port = parseInt(portStr, 10);

    const validIP = parts.every((n) => n >= 0 && n <= 255);
    const validPort = port > 0 && port <= 65535;

    return validIP && validPort;
  }

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      let credentials: any = { type: credentialsType };
      if (credentialsType === "UserName") {
        credentials = { type: "UserName", userName, password };
      } else if (credentialsType === "Certificate") {
        credentials = { type: "Certificate", certificate, privateKey };
      }

      const payload = {
        methodName: "readNode",
        methodPayload: {
          endpoint,
          credentials,
          messageSecurityMode,
          securityPolicy,
          nodeId,
        },
      };
      const result = await edgeConfigApi.invokeDirectMethod(deviceId, moduleName, payload);
      return result;
    },
    onError: () => {
      setStatusCode(500);
      setOpcuaStatusCode(null);
      toast.error(`Error: Could not read node-id ${nodeId} on Device ${deviceId}`);
    },
    onSuccess: (result) => {
      setStatusCode(result.status);
      setOpcuaStatusCode(result.payload.statusCode.value)
      setFormattedResult(JSON.stringify(result.payload, null, 2));
    },
  });

  const badgeColorStatusCode =
    isPending ? "bg-yellow-500" : statusCode === 200 ? "bg-green-500" : statusCode ? "bg-red-500" : "bg-gray-300";

  const badgeColorOpcuaStatusCode = 
    isPending ? "bg-yellow-500" : opcuaStatusCode === 0 ? "bg-green-500" : opcuaStatusCode ? "bg-red-500" : "bg-gray-300";

  return(
    <div className="flex flex-col gap-4 max-w-2xl">
      {/* Endpoint Input */}
      <div>
        <InputLabel>
          <input
            className={`border rounded px-2 py-1 w-full ${!endpointValid ? "border-red-500" : ""}`}
            value={endpoint}
            onChange={(e) => {
              const v = e.target.value;
              setEndpoint(v);
              setEndpointValid(validateEndpoint(v));
            }}
            placeholder="opc.tcp://x.x.x.x:port"
          />
        </InputLabel>
        {!endpointValid && (
          <p className="text-red-600 text-sm mt-1">Must be in format: opc.tcp://x.x.x.x:port</p>
        )}
      </div>

      {/* NodeId Input */}
      <InputLabel>
        <input
          className="border rounded px-2 py-1 w-full"
          value={nodeId}
          onChange={(e) => setNodeId(e.target.value)}
          placeholder="Enter node ID..."
        />
      </InputLabel>

      {/* Credentials-Type */}
      <div>
        <label className="text-sm font-medium mb-1 block">Credentials</label>
        <Select
          value={{ value: credentialsType, label: credentialsType }}
          onChange={(opt: any) => setCredentialsType(opt.value)}
          options={[
            { value: "Anonymous", label: "Anonymous" },
            { value: "UserName", label: "UserName" },
            { value: "Certificate", label: "Certificate" },
          ]}
        />
      </div>

      {/* Credentials Felder abhängig vom Typ */}
      {credentialsType === "UserName" && (
        <div className="grid grid-cols-2 gap-4">
          <InputLabel>
            <input
              className="border rounded px-2 py-1 w-full"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="UserName"
            />
          </InputLabel>
          <InputLabel>
            <input
              className="border rounded px-2 py-1 w-full"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
          </InputLabel>
        </div>
      )}

      {credentialsType === "Certificate" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Certificate (PEM)</label>
            <textarea
              className="border rounded p-2 text-sm font-mono"
              rows={6}
              value={certificate}
              onChange={(e) => setCertificate(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Private Key (PEM)</label>
            <textarea
              className="border rounded p-2 text-sm font-mono"
              rows={6}
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Security Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Security Mode</label>
          <Select
            value={{ value: messageSecurityMode, label: messageSecurityMode }}
            onChange={(opt: any) => setMessageSecurityMode(opt.value)}
            options={[
              { value: "None", label: "None" },
              { value: "Sign", label: "Sign" },
              { value: "SignAndEncrypt", label: "SignAndEncrypt" },
            ]}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Security Policy</label>
          <Select
            value={{ value: securityPolicy, label: securityPolicy }}
            onChange={(opt: any) => setSecurityPolicy(opt.value)}
            options={[
              "None",
              "Basic128",
              "Basic192",
              "Basic256Rsa15",
              "Basic256Sha256",
              "Aes128_Sha256_RsaOaep",
              "Aes256_Sha256_RsaPss",
              "PubSub_Aes128_CTR",
              "PubSub_Aes256_CTR",
              "Basic128Rsa15",
              "Basic256",
            ].map((p) => ({ value: p, label: p }))}
          />
        </div>
      </div>

      {/* Read Button + Badge */}
      <div className="flex items-center gap-3">
        <Button
          onClick={() => mutate()}
          disabled={!nodeId || !endpointValid || !endpoint}
          processing={isPending}
        >
          Read Node
        </Button>
        

        {/* Edge-API Status */}
        <div className="flex items-center gap-2">
          <span className="font-medium">Edge-API:</span>
          <Badge className={`text-white ${badgeColorStatusCode}`}>
            {isPending
              ? "Loading..."
              : statusCode != null
              ? `Status ${statusCode}`
              : "Idle"}
          </Badge>
        </div>

        {/* OPC-UA Status */}
        <div className="flex items-center gap-2">
          <span className="font-medium">OPC-UA:</span>
          <Badge className={`text-white ${badgeColorOpcuaStatusCode}`}>
            {isPending
              ? "Loading..."
              : opcuaStatusCode != null
              ? opcuaStatusCode === 0
                ? "Success"
                : "OPC-UA Error"
              : "Idle"}
          </Badge>
        </div>
      </div>

      {/* Result JSON */}
      <pre className="bg-gray-100 rounded p-3 text-sm font-mono whitespace-pre-wrap">
        {formattedResult || "// Response will appear here...\n\n\n\n\n\n\n\n\n"}
      </pre>
        </div>
  )
}






