import { useRouteError } from "react-router-dom";
import { AlertCircle } from "lucide-react";

const Error = () => {
  const error = useRouteError();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
        <AlertCircle className="h-7 w-7 text-red-600" />
      </div>
      <h1 className="text-xl font-bold text-gray-900">
        Oops! An Error Occurred
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        {error?.status} : {error?.statusText}
      </p>
    </div>
  );
};

export default Error;
