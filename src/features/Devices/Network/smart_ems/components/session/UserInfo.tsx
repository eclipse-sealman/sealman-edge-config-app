import { Badge } from "@/components/ui/badge";
import { useGetUserInfo } from "../../hooks/useGetUserInfo";

export function UserInfo() {
  const { user } = useGetUserInfo();

  return (
    <>
      <div>
        <p className="font-bold">{user?.email}</p>
      </div>
      <div>
        <div className="flex space-x-2">
          <p>roles: </p>
          {user?.roles.map((r, i) => (
            <Badge variant="secondary" key={`${i}-${r}`}>
              {r}
            </Badge>
          ))}
        </div>
      </div>
    </>
  );
}
