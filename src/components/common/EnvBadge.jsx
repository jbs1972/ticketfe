const ENV_LABELS = {
  development: "DEV",
  uat: "UAT",
  production: "PROD",
};

const ENV_COLORS = {
  development: "bg-slate-700/60",
  uat: "bg-amber-600/60",
  production: "bg-emerald-700/60",
};

const EnvBadge = () => {
  const env = import.meta.env.MODE;
  const label = ENV_LABELS[env] || env.toUpperCase();
  const color = ENV_COLORS[env] || "bg-slate-700/60";

  return (
    <span
      className={`rounded-full ${color} px-2.5 py-0.5 text-[10px] font-medium text-white shadow-sm backdrop-blur-sm`}
    >
      {label} · v{__APP_VERSION__}
    </span>
  );
};

export default EnvBadge;
