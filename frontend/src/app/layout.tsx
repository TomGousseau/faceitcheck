import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FACEIT Analyzer | Match Strategy',
  description: 'Analyze FACEIT matches and get strategic insights',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        <div className="grid-bg min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
