import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthContext';
import { useAppLoadingTask } from '../providers/AppLoadingProvider';
import { shouldResumeXamanPkceConnect } from '../utils/oauthCallbackGuards';
import { getXamanConnectIntent } from '../utils/xamanConnectIntent';

interface ProtectedRouteProps {
    children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const location = useLocation();

    useAppLoadingTask('auth-session', loading);

    if (loading) {
        return null;
    }

    if (!user) {
        if (
            shouldResumeXamanPkceConnect(location.pathname, location.search) &&
            getXamanConnectIntent() === 'wallet_auth'
        ) {
            return <Navigate to={`/${location.search}`} replace />;
        }
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

export default ProtectedRoute;
