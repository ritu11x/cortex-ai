import { useLocation } from 'react-router-dom'

export default function PageWrapper({ children }) {
  const { pathname } = useLocation()
  return (
    <div key={pathname} className="animate-page-in">
      {children}
    </div>
  )
}
