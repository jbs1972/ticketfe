export const APP_LOGO_URL =
  "https://cdn-icons-png.flaticon.com/512/10729/10729094.png";

export const ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  USER: "user",
};

export const ROLE_LABELS = {
  superadmin: "Super Admin",
  admin: "Administrator",
  user: "Member",
};

export const ROLE_COLORS = {
  superadmin: {
    avatar: "bg-rose-600 hover:bg-rose-700",
    text: "text-rose-600",
    badge: "bg-rose-100 text-rose-700",
    banner: "bg-gradient-to-r from-rose-700 to-orange-600",
  },
  admin: {
    avatar: "bg-violet-600 hover:bg-violet-700",
    text: "text-purple-600",
    badge: "bg-purple-100 text-purple-700",
    banner: "bg-gradient-to-r from-purple-700 to-fuchsia-600",
  },
  user: {
    avatar: "bg-blue-600 hover:bg-blue-700",
    text: "text-blue-600",
    //badge: "bg-blue-100 text-blue-700",
    banner: "bg-gradient-to-r from-blue-600 to-cyan-500",
  },
};
