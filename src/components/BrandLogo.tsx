type BrandLogoProps = {
  compact?: boolean
}

export function BrandLogo({ compact = false }: BrandLogoProps) {
  return (
    <div className="brand-logo" aria-label="ReeditPro">
      <img
        alt=""
        aria-hidden="true"
        className={compact ? 'brand-logo-mark brand-logo-compact' : 'brand-logo-mark'}
        src="/brand/reeditpro-mark.png"
      />
      {!compact && (
        <span className="brand-wordmark-tail">
          <span className="brand-wordmark-main">eedit</span>
          <span className="brand-wordmark-pro">Pro</span>
        </span>
      )}
    </div>
  )
}
