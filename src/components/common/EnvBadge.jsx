const EnvBadge = () => {
  return (
    <span className="rounded-full bg-gray-700/60 px-2.5 py-0.5 text-[10px] font-medium text-white shadow-sm backdrop-blur-sm">
      v{__APP_VERSION__}
    </span>
  );
};

export default EnvBadge;



