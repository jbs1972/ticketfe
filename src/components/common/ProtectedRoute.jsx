import { Navigate } from "react-router-dom";

import useAuth from "../../hooks/useAuth";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { loading, isAuthenticated, user } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-96px)] items-center justify-center">
        <p className="text-lg font-medium text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const userRole = user?.isAdmin ? "admin" : "user";

    if (userRole !== requiredRole) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
