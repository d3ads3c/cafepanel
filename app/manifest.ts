import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CafeManager',
    short_name: 'CafeManager',
    description: 'Manage your Cafe Or Resturant in Smart Ways',
    start_url: '/',
    display: 'standalone',
    background_color: '#fff',
    theme_color: '#fff',
    icons: [
      {
        src: 'img/logo/192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'img/logo/512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}