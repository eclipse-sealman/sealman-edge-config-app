import { useState } from "react";
import { useParams } from "react-router-dom";
import Badge, { BadgeColor } from "../../../components/Typography/Badge";
import { ChevronRightIcon, LinkIcon } from "@heroicons/react/24/outline";
import Modal, { ModalState } from "../../../components/Modal/Modal";
import { Tab } from "@headlessui/react";
import ModuleLogs from "./ModuleLogs";
import ModuleConfig from "./ModuleConfig";
import DirectMethods from "./DirectMethods";
import { edgeConfigApi } from "../../../api/edgeConfig/edgeConfigApi";
import { useQuery } from "@tanstack/react-query";
import { edgeConfigApiHooks, ModuleData } from "../../../api/edgeConfig/edgeConfigApiHooks";
import { Table, THead, TH, TBody, TR, TD } from "../../../components/Table/TableComponents";


export default function ModuleList() {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    children: <></>
  });
  const { deviceId } = useParams();
  const { data: modules } = edgeConfigApiHooks.useGetModules(deviceId);

  const { isPending, isError, data: moduleData, error: statusError} = useQuery<ModuleData[], Error, ModuleData[]>({
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

  if (isPending) return <div>Loading...</div>
  if (isError) return <div>Error: {statusError.message}</div>

  const moduleRows = moduleData.map((module, index) => (
    <TR onClick={() => setModalState({
      children: <ModuleModal module={module} />,
      title: <div className="flex items-center">{deviceId}<ChevronRightIcon className="w-4 h-4" /> {module.moduleName}</div>,
      isOpen: true
    })} key={index}>
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
      <TD className="flex items-center">
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
      <Modal modalState={modalState} setModalState={setModalState}></Modal>
    </>
  );
}

function ModuleModal({ module }: { module: ModuleData }) {
  return (
    <Tab.Group className="h-full">
      <div className="h-full">
        <Tab.List>
          <div className="grid grid-cols-3 p-2 bg-vibrant-blue text-white rounded-sm">
            <Tab className={({ selected }) => `rounded-sm ${selected ? 'bg-blue-500 text-white' : ''}`}>
              Module Configuration
            </Tab>
            <Tab className={({ selected }) => `rounded-sm ${selected ? 'bg-blue-500 text-white' : ''}`}>
              Methods
            </Tab>
            <Tab className={({ selected }) => `rounded-sm ${selected ? 'bg-blue-500 text-white' : ''}`}>
              Logs
            </Tab>
          </div>
        </Tab.List>
        <Tab.Panels as="div" className="h-full overflow-y-auto">
          <Tab.Panel className="h-full ">
            <ModuleConfig moduleName={module.moduleId} appMessage={module.appMessage} moduleStatus={module.status} />
          </Tab.Panel>
          <Tab.Panel className="h-full ">
            <DirectMethods moduleName={module.moduleId} />
          </Tab.Panel>
          <Tab.Panel className="h-full ">
            <ModuleLogs moduleName={module.moduleId} />
          </Tab.Panel>
        </Tab.Panels>
      </div>
    </Tab.Group>
  );
}
