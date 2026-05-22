export const postModuleTwinConfigMocked = vi.fn()

export const usePostModuleTwinConfig = vi.fn(() => {
  return {
    PostModuleTwinConfig: postModuleTwinConfigMocked
  }
})
