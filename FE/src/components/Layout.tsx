import { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="layout">
      <header className="layout-header">
        <nav className="layout-nav">
          <a href="/">Home</a>
        </nav>
      </header>
      <main className="layout-main">{children}</main>
      <footer className="layout-footer">
        <p>&copy; 2026 RBL Project Group 3</p>
      </footer>
    </div>
  )
}
