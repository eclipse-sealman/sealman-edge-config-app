export const postDeviceNatConfigMocked = vi.fn()

export const usePostDeviceNatConfig = vi.fn(() => {
  return {postDeviceNatConfig: postDeviceNatConfigMocked}
})
