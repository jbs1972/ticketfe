import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from "react-router-dom";
import "./index.css";
import Toast from "./components/common/Toast";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Header from "./Header";
import Error from "./Error";
import Dashboard from "./components/pages/Dashboard";
import Ticket from "./components/pages/Ticket";
import LoginPage from "./components/auth/LoginPage";
import Users from "./components/pages/Users";
import AuthProvider from "./context/AuthContext";
import Breadcrumb from "./components/common/Breadcrumb";
import TicketDetail from "./components/pages/TicketDetail";
import BackendGate from "./components/common/BackendGate";
import EnvBadge from "./components/common/EnvBadge";
import Configure from "./components/pages/Configure";

const AppLayout = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <Breadcrumb />
      <main className="px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
};

const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <Error />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "tickets",
        element: (
          <ProtectedRoute>
            <Ticket />
          </ProtectedRoute>
        ),
      },
      {
        path: "tickets/:ticketCode",
        element: (
          <ProtectedRoute>
            <TicketDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: "users",
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <Users />
          </ProtectedRoute>
        ),
      },
      {
        path: "configure",
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <Configure />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BackendGate>
      <AuthProvider>
        <RouterProvider router={appRouter} />
        <Toast />
      </AuthProvider>
    </BackendGate>
  </StrictMode>,
);
