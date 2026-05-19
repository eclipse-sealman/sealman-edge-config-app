export const useMutationMocked = vi.fn()

export default function mock() {
  return {
    mutateAsync: useMutationMocked,
    isPending: false
  }
}
