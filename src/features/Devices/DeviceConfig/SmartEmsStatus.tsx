import React from "react";
import { useParams } from "react-router-dom";
import Badge, { BadgeColor } from "../../../components/Typography/Badge";

import { DictionaryListEntries } from "../../../components/Table/DictionaryList"
import { Heading } from "../../../components/Typography/Heading";
import { InformationCircleIcon, QueueListIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { edgeConfigApi } from "../../../api/edgeConfig/edgeConfigApi";
import { AxiosError } from "axios";
import DictionaryList from "../../../components/Table/DictionaryList";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SmartEMSStatus {
  configUpdateScheduled: boolean
  deviceEnabled: boolean
  deviceHardwareVersion: string
  deviceFirmwareVersion: string
  deviceTemplate: string
  firmwareUpdateScheduled: boolean
  edgeCommandStatus: [{
    cmdName: string
    created: string
    status: string
    updated: string
  }]
}

export default function SmartEmsStatus() {

  const { deviceId } = useParams();

  // TODO: refactor with useGetSmartEmsStatus
  const { data: smartEmsStatus, isPending, isError, error, isFetching } = useQuery<SmartEMSStatus, AxiosError>({
    queryKey: ['getSmartEmsStatus', deviceId],
    queryFn: () => edgeConfigApi.getSmartEmsStatus(deviceId),
    refetchInterval: 3000   // Polling for seeing if config updates are scheduled
  });

  let tableData: DictionaryListEntries = {
    "Firmware Version": "",
    "Template": "",
    "FW Update Scheduled": "",
    "Config Update Scheduled": ""
  }

  let commandTable: React.JSX.Element[] = []

  if (smartEmsStatus) {
    tableData = {
      "Firmware Version": smartEmsStatus.deviceFirmwareVersion,
      "Template": smartEmsStatus.deviceTemplate,
      "FW Update Scheduled": <Badge color={smartEmsStatus.firmwareUpdateScheduled ? BadgeColor.Purple : BadgeColor.Blue}>{smartEmsStatus.firmwareUpdateScheduled ? "True" : "False"}</Badge>,
      "Config Update Scheduled": <Badge color={smartEmsStatus.configUpdateScheduled ? BadgeColor.Purple : BadgeColor.Blue}>{smartEmsStatus.configUpdateScheduled ? "True" : "False"}</Badge>
    }

    const filteredEdgeCommands = smartEmsStatus.edgeCommandStatus.filter((command) => command.cmdName !== "get_config");

    commandTable = filteredEdgeCommands.map((command, index) => {
      return (
        <TableRow key={index}>
          <TableCell>{command.cmdName}</TableCell>
          <TableCell><Badge color={(command.status === 'success' || command.status === 'pending') ? BadgeColor.Green : BadgeColor.Red}>{command.status}</Badge></TableCell>
          <TableCell>{new Date(command.created).toLocaleString()}</TableCell>
          <TableCell>{new Date(command.updated).toLocaleString()}</TableCell>
        </TableRow>
      )
    })
  }

  const errorMessage = isError ? `${error.message}` : undefined

  return (
    <>
      <div>
        <Heading processing={isFetching} description="Current configuration state of the Smart-EMS."><InformationCircleIcon className="w-5 h-5" />Configuration Information</Heading>
        <DictionaryList dictionary={tableData} processing={isPending} error={errorMessage}/>
      </div>

      <div>
        <Heading description="Commands recently sent to the Smart-EMS."><QueueListIcon className="w-5 h-5" />Command History</Heading>
        <div className="border rounded-lg overflow-hidden bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Command Name</TableHead>
                <TableHead>Command Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{commandTable}</TableBody>
          </Table>
        </div>
      </div>
    </>
  )
}
