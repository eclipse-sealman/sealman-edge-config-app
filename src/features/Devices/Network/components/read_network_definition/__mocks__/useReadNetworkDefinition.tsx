import { ReadNetworkDefinition } from "../useReadNetworkDefinition"

export const useReadNetworkDefinitionMocked: ReadNetworkDefinition = {
  isReading: false,
  readNetwork: vi.fn(),
}

export default function mocked(): ReadNetworkDefinition {
  return useReadNetworkDefinitionMocked
}
