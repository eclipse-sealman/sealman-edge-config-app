import { useGetJwt } from '../../config/authConfig';
import { ReactNode } from 'react';
import { ErrorState, LoadingState } from '@/components/ui/page-state';

interface ProtectedPageProps {
  requiredRoles: string[], // One of them is necessary
  children: ReactNode,
  fallback?: ReactNode
}

export default function AuthGuard({requiredRoles, children, fallback}: ProtectedPageProps) {
  const jwtQuery = useGetJwt();

  if (jwtQuery.isPending)
    return <LoadingState />

  if (jwtQuery.isError)
    return <ErrorState title="Could not verify your access" />

  if (!requiredRoles.some(role => jwtQuery.data?.roles?.includes(role)))
    return <>{fallback}</>
    

  return <>{children}</>
};
