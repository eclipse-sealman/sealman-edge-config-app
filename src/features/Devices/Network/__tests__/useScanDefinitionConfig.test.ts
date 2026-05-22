import { act, renderHook } from "@testing-library/react"
import useScanDefinitionConfig from "../useScanDefinitionConfig"
import { ScanDefinition } from "../../../../api/edgeConfig/networkDiscover/networkDiscoverInterfaces"

describe("useScanDefinitionConfig", () => {
  suite("Network Prefix", () => {
    it("should return the network prefix", () => {
      const { result } = renderHook(() => useScanDefinitionConfig({networkDefinition: "172.0.0.0"} as ScanDefinition ))

      expect(result.current.networkPrefix).toBe("172.0.0.0")
    })

    it("should update the network prefix", () => {
      const input = { networkDefinition: "Hi"} as ScanDefinition
      const { result } = renderHook(() => useScanDefinitionConfig(input ))

      act(() => {
        result.current.updateNetworkPrefix("test")
      })

      expect(result.current.networkPrefix).toBe("test")
    })
  })

  suite("Subnet", () => {
    it("should return the subnet", () => {
      const { result } = renderHook(() => useScanDefinitionConfig({subnetMask: 24} as ScanDefinition ))

      expect(result.current.subnet).toBe(24)
    })

    it("should update the subnet", () => {
      const input = {subnetMask: 24} as ScanDefinition
      const { result } = renderHook(() => useScanDefinitionConfig(input ))

      act(() => {
        result.current.updateSubnetMask(23)
      })

      expect(result.current.subnet).toBe(23)
    })
  })

  suite("Ports", () => {
    it("should return the ports", () => {
      const input = {ports: [21, 443]} as ScanDefinition
      const { result } = renderHook(() => useScanDefinitionConfig(input ))

      expect(result.current.ports).toEqual([21, 443])
    })

    it("should add a port", () => {
      const input = {ports: [21, 443]} as ScanDefinition
      const { result }  = renderHook(() => useScanDefinitionConfig(input ))

      act(() => {
        result.current.addPort(22)
      })

      expect(result.current.ports).toMatchObject([21, 443, 22])
    })

    it("should remove a port", () => {
      const input = {ports: [21, 443]} as ScanDefinition
      const { result }  = renderHook(() => useScanDefinitionConfig(input ))

      act(() => {
        result.current.removePort(21)
      })

      expect(result.current.ports).toMatchObject([443])
    })

    it("should remove all ports", () => {
      const input = {ports: [21, 443]} as ScanDefinition
      const { result }  = renderHook(() => useScanDefinitionConfig(input ))

      act(() => {
        result.current.removeAllPorts()
      })

      expect(result.current.ports).toMatchObject([])
    })
  })

  suite("Reset", () => {
    it("should reset the states", () => {
      const input: ScanDefinition = {
        networkDefinition: "Initial",
        subnetMask: 23,
        ports: [21]
      }
      const { result } = renderHook(() => useScanDefinitionConfig(input ))

      act(() => {
        result.current.updateNetworkPrefix("test")
        result.current.updateSubnetMask(19)
        result.current.removeAllPorts()
      })

      act(() => {
        result.current.reset()
      })

      expect(result.current.networkPrefix).toBe("Initial")
      expect(result.current.subnet).toBe(23)
      expect(result.current.ports).toMatchObject([21])
    })

  })
})
