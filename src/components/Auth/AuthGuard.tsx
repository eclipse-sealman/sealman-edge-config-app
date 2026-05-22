import { useGetJwt } from '../../config/authConfig';
import { ReactNode } from 'react';

interface ProtectedPageProps {
  requiredRoles: string[], // One of them is necessary
  children: ReactNode,
  fallback?: ReactNode
}

export default function AuthGuard({requiredRoles, children, fallback}: ProtectedPageProps) {
  const jwtQuery = useGetJwt();

  if (jwtQuery.isPending)
    return <>Loading...</>

  if (jwtQuery.isError)
    return <>Error</>

  if (!requiredRoles.some(role => jwtQuery.data?.roles?.includes(role)))
    return <>{fallback}</>
    

  return <>{children}</>
};
