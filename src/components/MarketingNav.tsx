import { Link } from 'react-router-dom'
import { marketingLinks } from '../data/mockData'
import { BrandLogo } from './BrandLogo'
import { Button } from './Button'

export function MarketingNav() {
  return (
    <header className="marketing-nav">
      <Link aria-label="ReeditPro home" to="/">
        <BrandLogo />
      </Link>
      <nav aria-label="Marketing navigation">
        {marketingLinks.map((link) =>
          link.href.startsWith('/') ? (
            <Link key={link.label} to={link.href}>
              {link.label}
            </Link>
          ) : (
            <a href={link.href} key={link.label}>
              {link.label}
            </a>
          ),
        )}
      </nav>
      <div className="marketing-actions">
        <Button to="/dashboard" variant="ghost">
          Sign In
        </Button>
        <Button to="/projects/new" variant="primary">
          Start with chat
        </Button>
      </div>
    </header>
  )
}
