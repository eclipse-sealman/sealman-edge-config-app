import { edgeConfigApi } from "@/api/edgeConfig/edgeConfigApi";
import { useParams } from "react-router-dom";
import { toast } from 'react-toastify';
import { useState } from 'react';
import Select from "react-select";
import { Loader2 } from "lucide-react";
import { ChevronRight, ChevronDown, Folder, File } from "lucide-react";

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
  moduleName: string,
  nodeId: string,
  conn: ConnectionInfo
): Promise<ReferenceNode[]> {
  const payload = {
    methodName: "browseNode",
    methodPayload: {
      ...conn,
      nodeId,
    },
  };
  const result = await edgeConfigApi.invokeDirectMethod(deviceId, moduleName, payload);
  if (result?.status === 200 && result?.payload?.statusCode?.value === 0) {
    return result.payload.references as ReferenceNode[];
  }
  return [];
}

async function readNode(
  deviceId: string,
  moduleName: string,
  nodeId: string,
  conn: ConnectionInfo
): Promise<ReadResult | null> {
  const payload = {
    methodName: "readNode",
    methodPayload: {
      ...conn,
      nodeId,
    },
  };
  const result = await edgeConfigApi.invokeDirectMethod(deviceId, moduleName, payload);
  if (result?.status === 200 && result?.payload?.statusCode?.value === 0) {
    return result.payload as ReadResult;
  }
  return null;
}

interface TreeNodeProps {
  node: ReferenceNode;
  deviceId: string;
  moduleName: string;
  conn: ConnectionInfo;
  onReadResult: (node: ReferenceNode, value: ReadResult | null) => void;
}

const TreeNode: React.FC<TreeNodeProps & { browsingLock: boolean; setBrowsingLock: (v: boolean) => void; }> = ({
  node,
  deviceId,
  moduleName,
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
      const value = await readNode(deviceId, moduleName, node.nodeId, conn);
      onReadResult(node, value);

      if (!expanded && (node.nodeClass === "Object" || node.nodeClass === "Variable")) {
        const refs = await browseNode(deviceId, moduleName, node.nodeId, conn);
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
        className={`flex items-center cursor-pointer hover:bg-gray-100 rounded p-1 ${
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
          <Folder className="ml-1 mr-2 text-blue-500" size={16} />
        ) : (
          <File className="ml-1 mr-2 text-gray-500" size={16} />
        )}
        <span>{node.displayName?.text || node.browseName?.name}</span>
        {loading && <Loader2 className="ml-2 animate-spin text-gray-400" size={16} />}
      </div>

      {expanded && (
        <div className="pl-4 border-l border-gray-200 ml-2">
          {children.map((child) => (
            <TreeNode
              key={child.nodeId}
              node={child}
              deviceId={deviceId}
              moduleName={moduleName}
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


export const OpcUaTreeBrowser: React.FC<{ moduleName: string, endpoint: string }> = ({ moduleName, endpoint }) => {
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
      const refs = await browseNode(deviceId, moduleName, "ns=0;i=84", buildConn());
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
    const result = await readNode(deviceId, moduleName, selectedNode.nodeId, buildConn());
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
      <div className="p-4 border rounded">
        <h3 className="font-semibold mb-2">Connection Setting</h3>

        <div className="grid grid-cols-2 gap-3">
          <input
            className="border rounded px-2 py-1"
            placeholder="Endpoint"
            value={conn.endpoint}
            onChange={(e) => setConn({ ...conn, endpoint: e.target.value })}
            disabled={isConnected}
          />
          <Select
            value={{ value: credentialsType, label: credentialsType }}
            onChange={(opt: any) => setCredentialsType(opt.value)}
            options={[
              { value: "Anonymous", label: "Anonymous" },
              { value: "UserName", label: "UserName" },
              { value: "Certificate", label: "Certificate" },
            ]}
            isDisabled={isConnected}
          />

          {credentialsType === "UserName" && (
            <>
              <input
                className="border rounded px-2 py-1"
                placeholder="Username"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                disabled={isConnected}
              />
              <input
                className="border rounded px-2 py-1"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isConnected}
              />
            </>
          )}

          {credentialsType === "Certificate" && (
            <div className="col-span-2 grid grid-cols-2 gap-4">
              <textarea
                className="border rounded p-2 text-sm font-mono"
                rows={6}
                placeholder="PEM Certificate"
                value={certificate}
                onChange={(e) => setCertificate(e.target.value)}
                disabled={isConnected}
              />
              <textarea
                className="border rounded p-2 text-sm font-mono"
                rows={6}
                placeholder="PEM Private Key"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                disabled={isConnected}
              />
            </div>
          )}

          <Select
            value={{ value: conn.messageSecurityMode, label: conn.messageSecurityMode }}
            onChange={(opt: any) => setConn({ ...conn, messageSecurityMode: opt.value })}
            options={[
              { value: "None", label: "None" },
              { value: "Sign", label: "Sign" },
              { value: "SignAndEncrypt", label: "SignAndEncrypt" },
            ]}
            isDisabled={isConnected}
          />

          <Select
            value={{ value: conn.securityPolicy, label: conn.securityPolicy }}
            onChange={(opt: any) => setConn({ ...conn, securityPolicy: opt.value })}
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
            isDisabled={isConnected}
          />
        </div>

        <button
            onClick={isConnected ? handleDisconnect : loadRoot}
            className={`mt-3 px-3 py-1 rounded shadow flex items-center justify-center disabled:opacity-50 ${
                isConnected ? "bg-red-500 text-white hover:bg-red-600" : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
            >
                {isConnecting ? (
            <>
            <Loader2 className="animate-spin mr-2" size={16} />
                {isConnected ? "Disconnecting…" : "Connecting…"}
            </>
        ) : isConnected ? (
            "Disconnect"
        ) : (
            "Connect & Browse"
        )}
        </button>
      </div>

      <div className="flex gap-6">
        <div className="p-4 w-1/2 max-h-[600px] overflow-auto border rounded">
          {!initialized ? (
            <div className="text-gray-500">No connection made yet</div>
          ) : (
            rootNodes.map((node) => (
              <TreeNode
                key={node.nodeId}
                node={node}
                deviceId={deviceId!}
                moduleName={moduleName}
                conn={buildConn()}
                onReadResult={handleReadResult}
                browsingLock={browsingLock}
                setBrowsingLock={setBrowsingLock}
              />
            ))
          )}
        </div>

        <div className="p-4 w-1/2 border rounded bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Node Details</h3>
            {selectedNode && selectedNode.nodeClass === "Variable" && (
              <button
                onClick={handleRefresh}
                className="mt-3 px-3 py-1 bg-blue-500 text-white rounded shadow-sm flex items-center justify-center disabled:opacity-50"
              >
                {isReadingNode && <Loader2 className="animate-spin mr-2" size={16} />}
                <span className={`${isReadingNode ? "invisible" : ""}`}>Refresh</span>
              </button>
            )}
          </div>
          {selectedNode && readResult ? (
            readResult.statusCode.value === 0 ? (
              <table className="w-full text-sm border">
                <tbody>
                  <tr>
                    <td className="font-medium border px-2 py-1">Node</td>
                    <td className="border px-2 py-1">
                      {selectedNode.displayName?.text || selectedNode.browseName?.name}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-medium border px-2 py-1">NodeId</td>
                    <td className="border px-2 py-1">{selectedNode.nodeId}</td>
                  </tr>
                  <tr>
                    <td className="font-medium border px-2 py-1">DataType</td>
                    <td className="border px-2 py-1">{readResult.value.dataType}</td>
                  </tr>
                  <tr>
                    <td className="font-medium border px-2 py-1">ArrayType</td>
                    <td className="border px-2 py-1">{readResult.value.arrayType}</td>
                  </tr>
                  <tr>
                    <td className="font-medium border px-2 py-1">Value</td>
                    <td className="border px-2 py-1 whitespace-pre-wrap">
                      {JSON.stringify(readResult.value.value, null, 2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-medium border px-2 py-1">SourceTimestamp</td>
                    <td className="border px-2 py-1">{readResult.sourceTimestamp}</td>
                  </tr>
                  <tr>
                    <td className="font-medium border px-2 py-1">ServerTimestamp</td>
                    <td className="border px-2 py-1">{readResult.serverTimestamp}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className="text-red-600">OPC UA StatusCode: {readResult.statusCode.value}</div>
            )
          ) : (
            <div className="text-gray-500">No Node selected yet</div>
          )}
        </div>
      </div>
    </div>
  );
};
