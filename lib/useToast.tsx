'use client';

import toast from 'react-hot-toast';

export const useToast = () => {
  const showSuccess = (message: string) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } flex items-center justify-center mx-auto gap-3 px-4 py-3 bg-white border border-gray-100 rounded-full shadow-lg`}
      >
        <div className="flex items-center justify-center w-5 h-5 bg-green-100 rounded-full">
          <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <span className="text-sm font-medium text-green-700">{message}</span>
      </div>
    ));
  };

  const showError = (message: string) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } flex items-center justify-center mx-auto gap-3 px-4 py-3 bg-white border border-gray-100 rounded-full shadow-lg`}
      >
        <div className="flex items-center justify-center w-5 h-5 bg-red-100 rounded-full">
          <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
        <span className="text-sm font-medium text-red-700">{message}</span>
      </div>
    ));
  };

  const showWarning = (message: string) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } flex items-center justify-center mx-auto gap-3 px-4 py-3 bg-white border border-black/50 rounded-full shadow-lg`}
      >
        <div className="flex items-center justify-center w-5 h-5 bg-yellow-100 rounded-full">
          <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <span className="text-sm font-medium text-yellow-700">{message}</span>
      </div>
    ));
  };

  const showInfo = (message: string) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } flex items-center justify-center mx-auto gap-3 px-4 py-3 bg-white border border-black/50 rounded-full shadow-lg`}
      >
        <div className="flex items-center justify-center w-5 h-5 bg-blue-100 rounded-full">
          <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <span className="text-sm font-medium text-blue-700">{message}</span>
      </div>
    ));
  };

  return {
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
  };
};
