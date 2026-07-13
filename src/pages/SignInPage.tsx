import { useState, type FormEvent } from 'react'
import { ArrowLeft, KeyRound, LockKeyhole, ShieldCheck, UserRoundCheck } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { sanitizeInternalReturnTo } from '../auth/auth-navigation'
import { useAuthSession } from '../auth/useAuthSession'
import { BrandLogo } from '../components/BrandLogo'
import { Button } from '../components/Button'

export function SignInPage() {
  const auth = useAuthSession()
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(location.search)
  const returnTo = sanitizeInternalReturnTo(searchParams.get('returnTo') ?? searchParams.get('redirect'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  if (auth.status === 'signed_in') {
    return <Navigate replace to={returnTo} />
  }

  const enterLocalTestSession = async () => {
    setPending(true)
    setError('')
    const result = await auth.signInLocalTest()
    setPending(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    navigate(returnTo, { replace: true })
  }

  const submitSupabaseSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPending(true)
    setError('')
    const result = await auth.signInWithPassword(email, password)
    setPending(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    navigate(returnTo, { replace: true })
  }

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <main className="auth-page" id="main-content">
        <div aria-hidden="true" className="auth-topology" />
        <header className="auth-brand-row">
          <Link aria-label="ReeditPro home" to="/">
            <BrandLogo />
          </Link>
          <Link className="auth-back-link" to="/">
            <ArrowLeft aria-hidden="true" size={16} />
            Back
          </Link>
        </header>

        <section className="auth-layout">
          <div className="auth-intro">
            <span className="section-eyebrow">Private creative workspace</span>
            <h1>Pick up exactly where you left off.</h1>
            <p>Your projects, source media, plans, and private reviews stay organized inside one signed-in workspace.</p>
            <div className="auth-trust-list" aria-label="Workspace protections">
              <span><ShieldCheck aria-hidden="true" size={17} /><span><strong>Private source media</strong><small>Uploads stay inside the workspace.</small></span></span>
              <span><LockKeyhole aria-hidden="true" size={17} /><span><strong>Approval before credits</strong><small>No editing run begins before review.</small></span></span>
              <span><UserRoundCheck aria-hidden="true" size={17} /><span><strong>One clear session</strong><small>Projects remain tied to the signed-in identity.</small></span></span>
            </div>
          </div>

          <div className="auth-card" data-testid="sign-in-card">
            <div className="auth-card-heading">
              <span className="section-eyebrow">Sign in</span>
              <h2>Continue to ReeditPro</h2>
              <p>{auth.message}</p>
            </div>

            {auth.status === 'loading' && (
              <div aria-live="polite" className="auth-status" role="status">
                <span aria-hidden="true" className="route-loading-mark" />
                Checking session configuration…
              </div>
            )}

            {auth.status !== 'loading' && auth.mode === 'local_test' && (
              <div className="auth-local-test">
                <div className="auth-mode-note">
                  <span aria-hidden="true" className="auth-mode-dot" />
                  <div>
                    <strong>Local preview session</strong>
                    <p>A browser-only workspace is available for this private preview. It ends when this tab closes.</p>
                  </div>
                </div>
                <Button
                  data-testid="local-test-sign-in"
                  disabled={pending}
                  icon={KeyRound}
                  onClick={() => { void enterLocalTestSession() }}
                  variant="primary"
                >
                  {pending ? 'Opening workspace…' : 'Enter test workspace'}
                </Button>
              </div>
            )}

            {auth.status !== 'loading' && auth.mode === 'supabase' && (
              <form className="auth-form" onSubmit={(event) => { void submitSupabaseSignIn(event) }}>
                <label className="planning-field">
                  <span>Email</span>
                  <input
                    autoComplete="email"
                    inputMode="email"
                    name="email"
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    type="email"
                    value={email}
                  />
                </label>
                <label className="planning-field">
                  <span>Password</span>
                  <input
                    autoComplete="current-password"
                    name="password"
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    type="password"
                    value={password}
                  />
                </label>
                <Button data-testid="auth-submit-button" disabled={pending} icon={KeyRound} type="submit" variant="primary">
                  {pending ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>
            )}

            {auth.status === 'unavailable' && (
              <div className="auth-unavailable" role="status">
                <strong>Sign-in is not available here.</strong>
                <p>{auth.message} Use an approved local testing environment or configure Supabase public browser auth.</p>
              </div>
            )}

            {error && <p className="auth-error" role="alert">{error}</p>}

            <p className="auth-boundary-note">Private preview · No production billing or public delivery.</p>
          </div>
        </section>
      </main>
    </>
  )
}
