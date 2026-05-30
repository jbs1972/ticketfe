import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import Header from './Header';
import Dashboard from './components/Dashboard.jsx';
import Ticket from './components/Ticket.jsx';
import About from './components/About.jsx';
import Error from './Error';

const AppLayout = () => {
    return (
        <React.StrictMode>
            <div>
                <Header />
                <Outlet />
            </div>
        </React.StrictMode>
    );
};

const appRouter = createBrowserRouter([
    {
        path: "/",
        element: <AppLayout />,
        children: [
            {
                path: "/",
                element: <Dashboard />
            },
            {
                path: "/tickets",
                element: <Ticket />
            },
            {
                path: "/about",
                element: <About />
            }
        ],
        errorElement: <Error />
    },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={appRouter} />
  </StrictMode>,
);
