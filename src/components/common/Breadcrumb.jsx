import { Link, useLocation, useParams } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const LABELS = {
  dashboard: "Dashboard",
  tickets: "Tickets",
  users: "Users",
  configure: "Configure",
};

const Breadcrumb = () => {
  const location = useLocation();
  const params = useParams();
  const segments = location.pathname.split("/").filter(Boolean);

  if (segments.length === 0 || location.pathname === "/login") return null;

  const crumbs = segments.map((segment, index) => {
    const path = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;
    const isTicketCode = params.ticketCode && segment === params.ticketCode;
    const label = isTicketCode ? segment : LABELS[segment] || segment;
    return { path, label, isLast };
  });

  return (
    <nav className="mx-6 mt-4 flex items-center gap-2 text-sm text-gray-500">
      <Link
        to="/dashboard"
        className="flex items-center gap-1 transition-colors hover:text-blue-600"
      >
        <Home size={14} />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.path} className="flex items-center gap-2">
          <ChevronRight size={14} className="text-gray-400" />
          {crumb.isLast ? (
            <span className="font-medium text-gray-900">{crumb.label}</span>
          ) : (
            <Link
              to={crumb.path}
              className="transition-colors hover:text-blue-600"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
};

export default Breadcrumb;
