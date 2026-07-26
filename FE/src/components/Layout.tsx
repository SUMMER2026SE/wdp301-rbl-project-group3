import { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

/**
 * Renders the shared customer-facing shell around routed page content.
 * This boundary owns its UI state and delegates persistence to the appropriate service layer.
 */
export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="layout">
      <header className="layout-header">
        <nav className="layout-nav">
          <a href="/">Trang chủ</a>
        </nav>
      </header>
      <main className="layout-main">{children}</main>
      <footer className="layout-footer">
        <p>&copy; 2026 RBL Project Group 3</p>
      </footer>
    </div>
  )
}
/**
 * Composes the frontend application shell, global providers, and top-level navigation.
 * Keeping this concern isolated makes feature code easier to reuse and maintain.
 */
