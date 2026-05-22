import useGetDeviceNatConfig from "@/generated/edge-administration/hooks/useGetDeviceNatConfig"
import useGetSmartEmsStatus from "@/generated/edge-administration/hooks/useGetSmartEmsStatus"
import { usePostDeviceNatConfig } from "@/generated/edge-administration/hooks/usePostDeviceNatConfig"
import { components } from "@/generated/edge-administration/types"
import { useEffect, useState } from "react"
import { NatConfigRulesContextType } from "./context"

export default function useDeviceNatConfigContext(deviceId: string): NatConfigRulesContextType {
  const { data, isLoading: isGetNatConfigLoading} = useGetDeviceNatConfig(deviceId)
  const { data: smartEmsData, isLoading: isSmartEmsStatusLoading } = useGetSmartEmsStatus(deviceId ?? "")
  const { postDeviceNatConfig, isPending: postIsPending } = usePostDeviceNatConfig()
  const [natConfig, setNatConfig] = useState<components["schemas"]["NatConfig"]|undefined>()
  const isLoading = isGetNatConfigLoading || isSmartEmsStatusLoading

  const addNatRule = (rule: components["schemas"]["NatRule"]) => {
    setNatConfig(p => {
      if (!p) {
        return
      }
      const pRules = p.nat_rules ?? []


      return {
        ...p,
        nat_rules: [
          ...pRules,
          rule
        ]
      }
    })
  }

  const toggleNat = () => {
    const setNatTo = !(natConfig?.nat_enabled)
    setNatConfig(p => ({
      ...p,
      nat_enabled: setNatTo,
      nat_rules: []
    }))
  }

  const updateRule = ({index, rule}: {index: number, rule: components["schemas"]["NatRule"]}) => {
    if (!natConfig) {
      return;
    }
    if (!natConfig.nat_rules){
      return;
    }
    const config = Object.assign({}, natConfig)
    config.nat_rules![index].extIp = rule.extIp
    config.nat_rules![index].intIp = rule.intIp
    config.nat_rules![index].name = rule.name

    setNatConfig(config)
  }

  const deleteRule = (index: number) => {
    if (!natConfig) {
      return;
    }
    if (!natConfig.nat_rules){
      return;
    }
    const config = Object.assign({}, natConfig)
    config.nat_rules?.splice(index, 1)
    setNatConfig(config)
  }

  const postConfig = async () => {
    if(!natConfig) {
      return;
    }

    await postDeviceNatConfig({
      body: natConfig,
      deviceId,
    })
  }

  useEffect(() => {
    if (!data) {
      return
    }

    setNatConfig(data)
  }, [data])

  return  {
    smartEmsData,
    natConfig,
    addNatRule,
    toggleNat,
    updateRule,
    deleteRule,
    postConfig,
    isLoading,
    postIsPending,
    deviceId,
  }
}
