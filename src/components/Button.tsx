import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  icon?: LucideIcon
  to?: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

export function Button({
  children,
  className = '',
  icon: Icon,
  size = 'md',
  to,
  type = 'button',
  variant = 'secondary',
  ...props
}: ButtonProps) {
  const classes = `rp-button rp-button-${variant} rp-button-${size} ${className}`.trim()
  const content = (
    <>
      {Icon && <Icon aria-hidden="true" size={18} />}
      <span>{children}</span>
    </>
  )

  if (to) {
    return (
      <Link className={classes} to={to}>
        {content}
      </Link>
    )
  }

  return (
    <button className={classes} type={type} {...props}>
      {content}
    </button>
  )
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  icon: LucideIcon
}

export function IconButton({ className = '', icon: Icon, label, type = 'button', ...props }: IconButtonProps) {
  return (
    <button aria-label={label} className={`icon-button ${className}`.trim()} type={type} {...props}>
      <Icon aria-hidden="true" size={18} />
    </button>
  )
}
