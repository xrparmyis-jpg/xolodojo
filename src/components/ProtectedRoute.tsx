import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthContext';
import { shouldResumeXamanPkceConnect } from '../utils/oauthCallbackGuards';
import { getXamanConnectIntent } from '../utils/xamanConnectIntent';

interface ProtectedRouteProps {
    children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '50vh',
                    color: 'white',
                }}
            >
                Loading...
            </div>
        );
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
