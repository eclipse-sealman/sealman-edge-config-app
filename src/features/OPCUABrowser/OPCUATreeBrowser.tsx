import { edgeConfigApi } from "@/api/edgeConfig/edgeConfigApi";
import { useParams } from "react-router-dom";
import { toast } from 'react-toastify';
import { useState } from 'react';
import { Loader2 } from "lucide-react";
import { ChevronRight, ChevronDown, Folder, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function SectionTitle({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-lg font-semibold leading-none tracking-tight">{title}</h3>
        {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

interface BrowseName {
  namespaceIndex: number;
  name: string;
}
interface DisplayName {
  locale?: string;
  text: string;
}
interface ReferenceNode {
  referenceTypeId: string;
  isForward: boolean;
  nodeId: string;
  browseName: BrowseName;
  displayName: DisplayName;
  nodeClass: "Object" | "Variable" | string;
  typeDefinition?: string;
}
interface ReadResult {
  value: { dataType: string; arrayType: string; value: any };
  statusCode: { value: number };
  sourceTimestamp: string;
  serverTimestamp: string;
}

interface ConnectionInfo {
  endpoint: string;
  credentials:
    | { type: "Anonymous" }
    | { type: "UserName"; userName: string; password: string }
    | { type: "Certificate"; certificate: string; privateKey: string };
  messageSecurityMode: string;
  securityPolicy: string;
}

async function browseNode(
  deviceId: string,
  nodeId: string,
  conn: ConnectionInfo
): Promise<ReferenceNode[]> {
  const result = await edgeConfigApi.opcuaBrowseNode(deviceId, { ...conn, nodeId });
  if (result?.statusCode?.value === 0) {
    return result.references as ReferenceNode[];
  }
  return [];
}

async function readNode(
  deviceId: string,
  nodeId: string,
  conn: ConnectionInfo
): Promise<ReadResult | null> {
  const result = await edgeConfigApi.opcuaReadNode(deviceId, { ...conn, nodeId });
  if (result?.statusCode?.value === 0) {
    return result as ReadResult;
  }
  return null;
}

interface TreeNodeProps {
  node: ReferenceNode;
  deviceId: string;
  conn: ConnectionInfo;
  onReadResult: (node: ReferenceNode, value: ReadResult | null) => void;
}

const TreeNode: React.FC<TreeNodeProps & { browsingLock: boolean; setBrowsingLock: (v: boolean) => void; }> = ({
  node,
  deviceId,
  conn,
  onReadResult,
  browsingLock,
  setBrowsingLock,
}) => {
  const [children, setChildren] = useState<ReferenceNode[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    // Block other clicks if browsing is in progress
    if (browsingLock) return;

    setLoading(true);
    setBrowsingLock(true);

    try {
      const value = await readNode(deviceId, node.nodeId, conn);
      onReadResult(node, value);

      if (!expanded && (node.nodeClass === "Object" || node.nodeClass === "Variable")) {
        const refs = await browseNode(deviceId, node.nodeId, conn);
        setChildren(refs);
      }
      setExpanded(!expanded);
    } catch {
      toast.error(`Error: Could not browse node ${node.nodeId}`);
    } finally {
      setLoading(false);
      setBrowsingLock(false);
    }
  };

  return (
    <div className="pl-4">
      <div
        className={`flex items-center cursor-pointer hover:bg-muted/40 rounded-md p-1.5 text-sm ${
          browsingLock && !loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={handleClick}
      >
        {node.nodeClass === "Object" ? (
          expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
        ) : (
          <span className="w-4" />
        )}
        {node.nodeClass === "Object" ? (
          <Folder className="ml-1 mr-2 text-primary" size={16} />
        ) : (
          <File className="ml-1 mr-2 text-muted-foreground" size={16} />
        )}
        <span>{node.displayName?.text || node.browseName?.name}</span>
        {loading && <Loader2 className="ml-2 animate-spin text-muted-foreground" size={16} />}
      </div>

      {expanded && (
        <div className="pl-4 border-l ml-2">
          {children.map((child) => (
            <TreeNode
              key={child.nodeId}
              node={child}
              deviceId={deviceId}
              conn={conn}
              onReadResult={onReadResult}
              browsingLock={browsingLock}
              setBrowsingLock={setBrowsingLock}
            />
          ))}
        </div>
      )}
    </div>
  );
};


export const OpcUaTreeBrowser: React.FC<{ endpoint: string }> = ({ endpoint }) => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const [rootNodes, setRootNodes] = useState<ReferenceNode[]>([]);
  const [initialized, setInitialized] = useState(false);

  const [selectedNode, setSelectedNode] = useState<ReferenceNode | null>(null);
  const [readResult, setReadResult] = useState<ReadResult | null>(null);

  const [credentialsType, setCredentialsType] = useState<
    "Anonymous" | "UserName" | "Certificate"
  >("Anonymous");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [certificate, setCertificate] = useState("");
  const [privateKey, setPrivateKey] = useState("");

  const [conn, setConn] = useState<ConnectionInfo>({
    endpoint: endpoint,
    credentials: { type: "Anonymous" },
    messageSecurityMode: "None",
    securityPolicy: "None",
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isReadingNode, setIsReadingNode] = useState(false);
  const [browsingLock, setBrowsingLock] = useState(false);

  const buildConn = (): ConnectionInfo => {
    if (credentialsType === "UserName") {
      return {
        ...conn,
        credentials: { type: "UserName", userName, password },
      };
    }
    if (credentialsType === "Certificate") {
      return {
        ...conn,
        credentials: { type: "Certificate", certificate, privateKey },
      };
    }
    return { ...conn, credentials: { type: "Anonymous" } };
  };

  const loadRoot = async () => {
    if (!deviceId) return;
    setIsConnecting(true);
    try {
      const refs = await browseNode(deviceId, "ns=0;i=84", buildConn());
      setRootNodes(refs);
      setInitialized(true);
      setIsConnected(true)
    }
    catch {
      toast.error(`Error: Could not connect to Server - check login information`);
    }
    finally {
      setIsConnecting(false);
    }
    
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setRootNodes([]);
    setInitialized(false);
    setSelectedNode(null);
    setReadResult(null);
    };

  const handleReadResult = (node: ReferenceNode, result: ReadResult | null) => {
    setSelectedNode(node);
    setReadResult(result);
  };

  const handleRefresh = async () => {
  if (!deviceId || !selectedNode) return;
  setIsReadingNode(true);
  try {
    const result = await readNode(deviceId, selectedNode.nodeId, buildConn());
    setReadResult(result);
  }
  catch {
    toast.error("Could not read nodeId")
  }
  finally{
    setIsReadingNode(false)
  }
  
};

  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionTitle
          title="Connection Settings"
          description="Connect to an OPC UA server through this device and browse its address space."
        />
        <div className="bg-card border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Endpoint">
              <Input
                placeholder="opc.tcp://i.p.v.4:4840"
                value={conn.endpoint}
                onChange={(e) => setConn({ ...conn, endpoint: e.target.value })}
                disabled={isConnected}
              />
            </Field>
            <Field label="Credentials">
              <select
                className={selectClass}
                value={credentialsType}
                onChange={(e) => setCredentialsType(e.target.value as typeof credentialsType)}
                disabled={isConnected}
              >
                <option value="Anonymous">Anonymous</option>
                <option value="UserName">UserName</option>
                <option value="Certificate">Certificate</option>
              </select>
            </Field>

            {credentialsType === "UserName" && (
              <>
                <Field label="Username">
                  <Input
                    placeholder="Username"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    disabled={isConnected}
                  />
                </Field>
                <Field label="Password">
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isConnected}
                  />
                </Field>
              </>
            )}

            {credentialsType === "Certificate" && (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Certificate">
                  <Textarea
                    className="font-mono"
                    rows={6}
                    placeholder="PEM Certificate"
                    value={certificate}
                    onChange={(e) => setCertificate(e.target.value)}
                    disabled={isConnected}
                  />
                </Field>
                <Field label="Private Key">
                  <Textarea
                    className="font-mono"
                    rows={6}
                    placeholder="PEM Private Key"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    disabled={isConnected}
                  />
                </Field>
              </div>
            )}

            <Field label="Message Security Mode">
              <select
                className={selectClass}
                value={conn.messageSecurityMode}
                onChange={(e) => setConn({ ...conn, messageSecurityMode: e.target.value })}
                disabled={isConnected}
              >
                {["None", "Sign", "SignAndEncrypt"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Field>

            <Field label="Security Policy">
              <select
                className={selectClass}
                value={conn.securityPolicy}
                onChange={(e) => setConn({ ...conn, securityPolicy: e.target.value })}
                disabled={isConnected}
              >
                {[
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
                ].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </Field>
          </div>

          <Button
            variant={isConnected ? "destructive" : "default"}
            onClick={isConnected ? handleDisconnect : loadRoot}
            disabled={isConnecting}
          >
            {isConnecting && <Loader2 className="animate-spin" />}
            {isConnecting
              ? (isConnected ? "Disconnecting…" : "Connecting…")
              : isConnected
                ? "Disconnect"
                : "Connect & Browse"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/2">
          <SectionTitle title="Address Space" description="Select a node to read its value." />
          <div className="p-2 max-h-[600px] overflow-auto border rounded-lg bg-background">
            {!initialized ? (
              <div className="p-2 text-sm text-muted-foreground">No connection made yet</div>
            ) : (
              rootNodes.map((node) => (
                <TreeNode
                  key={node.nodeId}
                  node={node}
                  deviceId={deviceId!}
                  conn={buildConn()}
                  onReadResult={handleReadResult}
                  browsingLock={browsingLock}
                  setBrowsingLock={setBrowsingLock}
                />
              ))
            )}
          </div>
        </div>

        <div className="lg:w-1/2">
          <SectionTitle
            title="Node Details"
            actions={
              selectedNode && selectedNode.nodeClass === "Variable" ? (
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isReadingNode}>
                  {isReadingNode && <Loader2 className="animate-spin" />}
                  Refresh
                </Button>
              ) : undefined
            }
          />
          <div className="border rounded-lg overflow-hidden bg-background">
            {selectedNode && readResult ? (
              readResult.statusCode.value === 0 ? (
                <ul className="divide-y">
                  {[
                    ["Node", selectedNode.displayName?.text || selectedNode.browseName?.name],
                    ["NodeId", selectedNode.nodeId],
                    ["DataType", readResult.value.dataType],
                    ["ArrayType", readResult.value.arrayType],
                    ["Value", JSON.stringify(readResult.value.value, null, 2)],
                    ["SourceTimestamp", readResult.sourceTimestamp],
                    ["ServerTimestamp", readResult.serverTimestamp],
                  ].map(([label, value]) => (
                    <li key={label} className="grid grid-cols-3 items-start gap-4 px-4 py-3 text-sm">
                      <div className="font-medium text-muted-foreground">{label}</div>
                      <div className="col-span-2 whitespace-pre-wrap break-all">{value}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-sm text-destructive">OPC UA StatusCode: {readResult.statusCode.value}</div>
              )
            ) : (
              <div className="p-4 text-sm text-muted-foreground">No Node selected yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
