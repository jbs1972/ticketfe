import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import Toast from "./components/common/Toast";
import "./index.css";

import Header from "./Header";
import Error from "./Error";
import Dashboard from "./components/Dashboard";
import Ticket from "./components/Ticket";

import AuthProvider from "./context/AuthContext";

const AppLayout = () => {
  return (
    <div>
      <Header />
      <Outlet />
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
        element: <Dashboard />,
      },
      {
        path: "tickets",
        element: <Ticket />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={appRouter} />
      <Toast />
    </AuthProvider>
  </StrictMode>,
);
