import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'emoji.today Admin Dashboard',
  description: 'Admin dashboard for emoji.today voting platform',
  robots: 'noindex, nofollow', // Prevent search engine indexing
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
} 