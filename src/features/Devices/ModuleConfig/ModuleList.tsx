import { useState } from "react";
import { useParams } from "react-router-dom";
import Badge, { BadgeColor } from "../../../components/Typography/Badge";
import { LinkIcon } from "@heroicons/react/24/outline";
import SubTabs from "@/components/Navigation/SubTabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ModuleLogs from "./ModuleLogs";
import ModuleConfig from "./ModuleConfig";
import DirectMethods from "./DirectMethods";
import { edgeConfigApi } from "../../../api/edgeConfig/edgeConfigApi";
import { useQuery } from "@tanstack/react-query";
import { edgeConfigApiHooks, ModuleData } from "../../../api/edgeConfig/edgeConfigApiHooks";
import { Heading } from "../../../components/Typography/Heading";
import {
  Table,
  TableHeader as THead,
  TableHead as TH,
  TableBody as TBody,
  TableRow as TR,
  TableCell as TD,
} from "@/components/ui/table";
import { CubeIcon } from "@heroicons/react/24/outline";


export default function ModuleList() {
  const [selectedModule, setSelectedModule] = useState<ModuleData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { deviceId } = useParams();
  const { data: modules } = edgeConfigApiHooks.useGetModules(deviceId);

  const { isPending, isError, isFetching, data: moduleData, error: statusError} = useQuery<ModuleData[], Error, ModuleData[]>({
    queryKey: ['getConfigStatus', deviceId, modules],
    queryFn: async () => {
      const moduleNames = modules?.map((module) => module.moduleId);
      const configStatus = await edgeConfigApi.getConfigStatus(deviceId, { modules: moduleNames });
      const moduleData: any = modules?.map((module) => {
        return {
          ...module,
          appMessage: configStatus[module.moduleId]?.appMessage || undefined,
          appStatus: configStatus[module.moduleId]?.appStatus || undefined,
          confStatus: configStatus[module.moduleId]?.confStatus || undefined,
          desiredConfId: configStatus[module.moduleId]?.desiredConfId || undefined,
          reportedConfId: configStatus[module.moduleId]?.reportedConfId || undefined
        }
      });
      return moduleData;
    },
    enabled: !!modules,
    refetchInterval: 5000,
  });

  if (isPending) return <p className="text-sm text-muted-foreground">Loading modules...</p>
  if (isError) return <p className="text-sm text-destructive">Error: {statusError.message}</p>

  const moduleRows = moduleData.map((module, index) => (
    <TR className="cursor-pointer" onClick={() => {
      setSelectedModule(module);
      setDialogOpen(true);
    }} key={index}>
      <TD>
        <Badge color={module.connectionState === "Connected" ? BadgeColor.Green : BadgeColor.Red}>
          {module.connectionState === "Connected" ? <LinkIcon className="w-3 h-3" /> : ""}
        </Badge>
      </TD>
      <TD>
        <Badge color={
          (module.moduleName === "$edgeAgent" && module.status === "runtime_online") ? BadgeColor.Green :
          (module.moduleName === "$edgeAgent" && module.status === "runtime_offline") ? BadgeColor.Yellow :
          (module.moduleName === "$edgeAgent" && module.status === null) ? BadgeColor.Green :
          (module.moduleName === "$edgeHub" && module.status === "runtime_online") ? BadgeColor.Green :
          (module.moduleName === "$edgeHub" && module.status === "runtime_offline") ? BadgeColor.Yellow :
          (module.moduleName === "$edgeHub" && module.status === null) ? BadgeColor.Green :
          (module.status === "running") ? BadgeColor.Green :
          (module.status === "backoff") ? BadgeColor.Red :
          (module.status === "failed") ? BadgeColor.Red :
          (module.status === "unhealthy") ? BadgeColor.Red :
          (module.status === "stopped") ? BadgeColor.Red :
          (module.status === "deploy_scheduled") ? BadgeColor.Purple :
          (module.status === "delete_scheduled") ? BadgeColor.Yellow :
          (module.status === "unknown") ? BadgeColor.Gray :
          (module.status === "running:grey" || module.status === "backoff:grey"  || module.status === "failed:grey" || module.status === "unhealthy:grey" || module.status === "stopped:grey") ? BadgeColor.Gray : BadgeColor.Gray
        }>
          {module.status === "running" && "RUNNING"}
          {module.status === "backoff" && "BACKOFF"}
          {module.status === "failed" && "FAILED"}
          {module.status === "unhealthy" && "UNHEALTHY"}
          {module.status === "stopped" && "STOPPED"}
          {module.status === "unknown" && "UNKNOWN"}
          {module.status === "failed:grey" && "FAILED"}
          {module.status === "running:grey" && "RUNNING"}
          {module.status === "backoff:grey" && "BACKOFF"}
          {module.status === "unhealthy:grey" && "UNHEALTHY"}
          {module.status === "stopped:grey" && "STOPPED"}
          {module.status === "runtime_online" && "RUNTIME ONLINE"}
          {module.status === "runtime_offline" && "RUNTIME OFFLINE"}
          {module.status === null && "UNKNOWN"}
        </Badge>
      </TD>
      <TD>
        {(() => {
          switch (module.confStatus) {
            case 'NO_CONFIG':
              return <Badge color={BadgeColor.Gray}>NTS</Badge>;
            case 'OK':
              return <Badge color={BadgeColor.Green}>SYNC</Badge>;
            case 'PENDING':
              return <Badge color={BadgeColor.Yellow}>PENDING</Badge>;
            case 'INITIAL_PENDING':
              return <Badge color={BadgeColor.Purple}>INITIAL_PENDING</Badge>;
            default:
              return <Badge color={BadgeColor.Purple}>{module.confStatus}</Badge>;
          }
        })()}
      </TD>
      <TD>
        {(() => {
          switch (module.appStatus) {
            case 'OK':
              return <Badge color={BadgeColor.Green}>CONFIG OK</Badge>;
            case 'ERROR':
              return <Badge color={BadgeColor.Red}>CONFIG ERROR</Badge>;
            case 'NO_STATUS':
              return <Badge color={BadgeColor.Gray}>NO CONFIG</Badge>;
            default:
              return <Badge color={BadgeColor.Purple}>{module.appStatus}</Badge>;
          }
        })()}
      </TD>
      <TD className="font-medium">
        {module.moduleName}
      </TD>
      <TD>
      {(() => {
          switch (module.deploymentType) {
            case 'base':
              return <Badge color={BadgeColor.Indigo}>base</Badge>;
            case 'sems':
              return <Badge color={BadgeColor.Yellow}>sems</Badge>;
            default:
              return <Badge color={BadgeColor.Indigo}>base</Badge>;
          }
        })()}
      </TD>
      <TD>
      {(() => {
          switch (module.moduleType) {
            case 'iotedge':
              return <Badge color={BadgeColor.Indigo}>iotedge</Badge>;
            case 'api':
              return <Badge color={BadgeColor.Purple}>api</Badge>;
            case 'compose':
              return <Badge color={BadgeColor.Yellow}>compose</Badge>;
            default:
              return <Badge color={BadgeColor.Indigo}>iotedge</Badge>;
          }
        })()}
      </TD>
      <TD>{module.version}</TD>
    </TR>
  ));

  return (
    <>
      <Heading processing={isFetching} description="Modules deployed on this device. Select a module to view its configuration, methods and logs.">
        <CubeIcon className="w-5 h-5" />
        Modules
      </Heading>
      <div className="border rounded-lg overflow-hidden bg-background">
        <Table>
          <THead>
            <TR>
              <TH>API</TH>
              <TH>Module Status</TH>
              <TH>Config Sync</TH>
              <TH>Config Status</TH>
              <TH>Module Name</TH>
              <TH>Stack</TH>
              <TH>Type</TH>
              <TH>Version</TH>
            </TR>
          </THead>
          <TBody>{moduleRows}</TBody>
        </Table>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="flex h-[calc(100vh-12rem)] max-w-6xl flex-col gap-0 p-0">
          {selectedModule && (
            <>
              <DialogHeader className="border-b px-6 py-4 pr-12">
                <DialogTitle>{selectedModule.moduleName}</DialogTitle>
                <DialogDescription>
                  Module on device {deviceId}. Edit its twin configuration, invoke methods or inspect logs.
                </DialogDescription>
              </DialogHeader>
              <ModuleModal key={selectedModule.moduleId} module={selectedModule} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

const MODULE_TABS = [
  { id: "config", label: "Module Configuration" },
  { id: "methods", label: "Methods" },
  { id: "logs", label: "Logs" },
] as const;

type ModuleTabId = (typeof MODULE_TABS)[number]["id"];

function ModuleModal({ module }: { module: ModuleData }) {
  const [activeTab, setActiveTab] = useState<ModuleTabId>("config");

  return (
    <div className="flex min-h-0 flex-1 flex-col px-6 pt-3 pb-6">
      <SubTabs tabs={MODULE_TABS} active={activeTab} onChange={setActiveTab} />
      <div className="min-h-0 flex-1 pt-4">
        {activeTab === "config" && (
          <ModuleConfig moduleName={module.moduleId} appMessage={module.appMessage} moduleStatus={module.status} />
        )}
        {activeTab === "methods" && <DirectMethods moduleName={module.moduleId} />}
        {activeTab === "logs" && <ModuleLogs moduleName={module.moduleId} />}
      </div>
    </div>
  );
}
