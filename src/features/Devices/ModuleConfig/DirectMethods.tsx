import { useMutation } from "@tanstack/react-query";
import Button from "../../../components/Input/Button";
import { edgeConfigApi } from "../../../api/edgeConfig/edgeConfigApi";
import { useParams } from "react-router-dom";
import { toast } from 'react-toastify';
import { useState } from 'react';
import Badge, { BadgeColor } from "@/components/Typography/Badge";
import Select from "react-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const itemClass = "rounded-lg border bg-background px-4";
const triggerClass = "py-3 hover:no-underline";
const contentClass = "grid gap-3 border-t pt-4";

export default function DirectMethods({ moduleName }: { moduleName: string }) {

  return (
    <div className="h-full overflow-y-auto">
      <Accordion type="single" collapsible className="w-full space-y-2">
        <AccordionItem value="module-restart" className={itemClass}>
          <AccordionTrigger className={triggerClass}>Restart</AccordionTrigger>
          <AccordionContent className={contentClass}>
            <RestartModule moduleName={moduleName} />
          </AccordionContent>
        </AccordionItem>
        {moduleName.includes("opcua") &&
        <AccordionItem value="opcua" className={itemClass}>
          <AccordionTrigger className={triggerClass}>OPC UA</AccordionTrigger>
          <AccordionContent className={contentClass}>
            {moduleName.includes('seal-module-opcua-client') && <ReadNodeId moduleName={moduleName} />}
          </AccordionContent>
        </AccordionItem>
        }
        {moduleName.includes("opcua") &&
        <AccordionItem value="opcua-browser" className={itemClass}>
          <AccordionTrigger className={triggerClass}>OPC UA Browser</AccordionTrigger>
          <AccordionContent className={contentClass}>
            {moduleName.includes('seal-module-opcua-client') && <OpcUaTreeBrowser endpoint="opc.tcp://x.x.x.x:4840"/>}
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
            deviceId={deviceId} 
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
    isPending ? BadgeColor.Yellow : statusCode === 200 ? BadgeColor.Green : statusCode ? BadgeColor.Red : BadgeColor.Gray;

  const badgeColorOpcuaStatusCode =
    isPending ? BadgeColor.Yellow : opcuaStatusCode === 0 ? BadgeColor.Green : opcuaStatusCode ? BadgeColor.Red : BadgeColor.Gray;

  return(
    <div className="flex max-w-2xl flex-col gap-4">
      {/* Endpoint Input */}
      <div>
        <label htmlFor="opcua-endpoint" className="mb-1 block text-sm font-medium">Endpoint</label>
        <Input
          id="opcua-endpoint"
          className={!endpointValid ? "border-destructive" : ""}
          value={endpoint}
          onChange={(e) => {
            const v = e.target.value;
            setEndpoint(v);
            setEndpointValid(validateEndpoint(v));
          }}
          placeholder="opc.tcp://x.x.x.x:port"
        />
        {!endpointValid && (
          <p className="mt-1 text-sm text-destructive">Must be in format: opc.tcp://x.x.x.x:port</p>
        )}
      </div>

      {/* NodeId Input */}
      <div>
        <label htmlFor="opcua-node-id" className="mb-1 block text-sm font-medium">Node ID</label>
        <Input
          id="opcua-node-id"
          value={nodeId}
          onChange={(e) => setNodeId(e.target.value)}
          placeholder="Enter node ID..."
        />
      </div>

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
          <div>
            <label htmlFor="opcua-username" className="mb-1 block text-sm font-medium">UserName</label>
            <Input
              id="opcua-username"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="UserName"
            />
          </div>
          <div>
            <label htmlFor="opcua-password" className="mb-1 block text-sm font-medium">Password</label>
            <Input
              id="opcua-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
          </div>
        </div>
      )}

      {credentialsType === "Certificate" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">Certificate (PEM)</label>
            <Textarea
              className="font-mono"
              rows={6}
              value={certificate}
              onChange={(e) => setCertificate(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium">Private Key (PEM)</label>
            <Textarea
              className="font-mono"
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
          <span className="text-sm font-medium">Edge-API:</span>
          <Badge color={badgeColorStatusCode}>
            {isPending
              ? "Loading..."
              : statusCode != null
              ? `Status ${statusCode}`
              : "Idle"}
          </Badge>
        </div>

        {/* OPC-UA Status */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">OPC-UA:</span>
          <Badge color={badgeColorOpcuaStatusCode}>
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
      <pre className="whitespace-pre-wrap rounded-md border bg-muted p-3 font-mono text-sm">
        {formattedResult || "// Response will appear here...\n\n\n\n\n\n\n\n\n"}
      </pre>
    </div>
  )
}






