const handleSelectEndpointMocked = vi.fn()

export const useHandleSelectedEndpoint = vi.fn(() => {
  return {
    handleSelectEndpoint: handleSelectEndpointMocked
  }
})