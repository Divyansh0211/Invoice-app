import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/authContext';

const PrivateRoute = () => {
    const authContext = useContext(AuthContext);
    const { isAuthenticated, loading } = authContext;

    if (loading) return <div>Loading...</div>;

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
