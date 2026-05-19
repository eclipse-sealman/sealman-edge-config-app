import { Outlet } from 'react-router-dom';
import ErrorFallback from './ErrorFallback';
import AuthGuard from '../components/Auth/AuthGuard';

interface ProtectedPageProps {
  requiredRoles: string[], // One of them is necessary
}

export default function ProtectedPage({ requiredRoles }: ProtectedPageProps) {
  return (
    <AuthGuard requiredRoles={requiredRoles} fallback={<ErrorFallback error={new Error("Insufficient Permissions")} />} >
      <Outlet />
    </AuthGuard>
  )
};
