'use client';

import { Toaster } from 'react-hot-toast';

export default function CustomToaster() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={16}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: '0',
        },
      }}
    />
  );
}
