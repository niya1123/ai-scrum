export const runtime = 'nodejs'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Quantum Gomoku • AI Scrum</title>
      </head>
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 16 }}>
        {children}
      </body>
    </html>
  )
}
