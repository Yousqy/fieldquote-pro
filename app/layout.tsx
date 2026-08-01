import type { Metadata, Viewport } from 'next'
import './globals.css'
import ThemeProvider from '@/components/theme/ThemeProvider'

export const metadata: Metadata = {
  title: {
    default: 'FieldQuote Pro',
    template: '%s | FieldQuote Pro',
  },
  description:
    'Itemized quotes, on-site e-signatures, and SMS payment links for field trade contractors.',
  manifest: '/manifest.json',
  formatDetection: { telephone: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FieldQuote',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
