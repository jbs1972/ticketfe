import React from 'react'
import { useRouteError } from 'react-router-dom'

const Error = () => {
  const error = useRouteError();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-3xl font-bold">Oops! An Error Occurred</h1>
        <h2 className="text-xl text-gray-600 mt-2">{error?.status} : {error?.statusText}</h2>
    </div>
  )
}

export default Error