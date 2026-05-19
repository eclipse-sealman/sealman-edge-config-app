import { useListUserRoles } from "../services/smartems/hooks";

export function useGetUserInfo() {
  const query = useListUserRoles();
  const user = query.data && {
    email: query.data?.representation,
    roles: query.data?.roles,
  };

  return {
    user,
    ...query,
  };
}
