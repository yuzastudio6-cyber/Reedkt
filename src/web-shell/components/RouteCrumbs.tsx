import { Link, useLocation } from 'react-router-dom'
import { getProjectRoutePath, webShellRoutes } from '../web-shell-routes'

function matchesRoute(pathname: string, routePath: string): boolean {
  if (routePath === '*') return false
  const pattern = routePath.replace(':projectId', '[^/]+')
  return new RegExp(`^${pattern}$`).test(pathname)
}

export function RouteCrumbs() {
  const location = useLocation()
  const activeRoute = webShellRoutes.find((route) => matchesRoute(location.pathname, route.path)) ?? webShellRoutes[0]

  return (
    <nav className="web-shell-crumbs" aria-label="Breadcrumb">
      <Link to="/">Web shell</Link>
      {activeRoute.kind === 'project' && <Link to={getProjectRoutePath('project_overview')}>Controlled project</Link>}
      <span>{activeRoute.label}</span>
    </nav>
  )
}
