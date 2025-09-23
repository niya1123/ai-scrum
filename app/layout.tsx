export const runtime = 'nodejs'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <title>AI Scrum テンプレート</title>
      </head>
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, background: '#f8f9fb' }}>
        {children}
      </body>
    </html>
  )
}
