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
        <div className="grid grid-cols-4" key={index}>
          <div>{command.cmdName}</div>
          <div><Badge color={(command.status === 'success' || command.status === 'pending') ? BadgeColor.Green : BadgeColor.Red}>{command.status}</Badge></div>
          <div>{new Date(command.created).toLocaleString()}</div>
          <div>{new Date(command.updated).toLocaleString()}</div>
        </div>
      )
    })
  }

  const errorMessage = isError ? `${error.message}` : undefined

  return (
    <>
      <div>
        <Heading processing={isFetching}><InformationCircleIcon className="w-7 h-7 mr-1" />Configuration Information</Heading>
        <DictionaryList dictionary={tableData} processing={isPending} error={errorMessage}/>
      </div>

      <div>
        <Heading><QueueListIcon className="w-7 h-7 mr-1" />Command History</Heading>
        <div>
          <div className="grid grid-cols-4">
            <div className="font-medium">Command Name</div>
            <div className="font-medium">Command Status</div>
            <div className="font-medium">Created</div>
            <div className="font-medium">Updated</div>
          </div>
          {commandTable}
        </div>
      </div>
    </>
  )
}
