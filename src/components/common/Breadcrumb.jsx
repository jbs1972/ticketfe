import { Link, useLocation, useParams } from "react-router-dom";
import { FaChevronRight, FaHome } from "react-icons/fa";

const LABELS = {
  dashboard: "Dashboard",
  tickets: "Tickets",
  users: "Users",
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
    const label = isTicketCode
      ? `Ticket #${segment}`
      : LABELS[segment] || segment;

    return { path, label, isLast };
  });

  return (
    <nav className="mx-3 mt-3 flex items-center gap-2 text-sm text-slate-500">
      <Link
        to="/dashboard"
        className="flex items-center gap-1 hover:text-blue-600"
      >
        <FaHome size={12} />
      </Link>

      {crumbs.map((crumb) => (
        <span key={crumb.path} className="flex items-center gap-2">
          <FaChevronRight size={10} className="text-slate-400" />

          {crumb.isLast ? (
            <span className="font-medium text-slate-700">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="hover:text-blue-600">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
};

export default Breadcrumb;
