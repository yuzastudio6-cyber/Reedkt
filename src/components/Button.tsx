import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'
import type { LucideIcon } from 'lucide-react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  icon?: LucideIcon
  to?: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'link'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  children,
  className = '',
  disabled = false,
  icon: Icon,
  size = 'md',
  to,
  type = 'button',
  variant = 'secondary',
  ...props
}: ButtonProps) {
  const classes = `rp-button rp-button-${variant} rp-button-${size} ${disabled ? 'is-disabled' : ''} ${className}`.trim()
  const content = (
    <>
      {Icon && <Icon aria-hidden="true" size={18} />}
      <span>{children}</span>
    </>
  )

  if (to) {
    if (disabled) {
      return (
        <span aria-disabled="true" className={classes} role="link">
          {content}
        </span>
      )
    }

    return (
      <Link className={classes} to={to}>
        {content}
      </Link>
    )
  }

  return (
    <button className={classes} disabled={disabled} type={type} {...props}>
      {content}
    </button>
  )
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  icon: LucideIcon
}

export function IconButton({ className = '', icon: Icon, label, title, type = 'button', ...props }: IconButtonProps) {
  return (
    <button aria-label={label} className={`icon-button ${className}`.trim()} title={title ?? label} type={type} {...props}>
      <Icon aria-hidden="true" size={18} />
    </button>
  )
}
