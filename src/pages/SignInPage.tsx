import { useMemo, useState, type FormEvent } from 'react'
import { ArrowRight, CheckCircle2, LockKeyhole, RefreshCw, ShieldCheck, UserPlus } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthBootstrapStatusCard } from '../components/auth/AuthBootstrapStatusCard'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { signInWithEmailPassword, signUpWithEmailPassword } from '../backend/auth/auth-client-service'
import { useAuthBootstrap } from '../hooks/useAuthBootstrap'

type AuthFormMode = 'sign_in' | 'sign_up'
type AuthFormNotice = {
  tone: 'info' | 'success' | 'warning' | 'error'
  title: string
  detail: string
}

const DEFAULT_REDIRECT = '/internal-testing'

function sanitizeRedirect(value: string | null): string {
  if (!value) return DEFAULT_REDIRECT
  if (!value.startsWith('/')) return DEFAULT_REDIRECT
  if (value.startsWith('//')) return DEFAULT_REDIRECT
  if (/^\/(?:sign-in|auth)(?:\/|\?|#|$)/.test(value)) return DEFAULT_REDIRECT
  return value
}

function isUsableEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isUsablePassword(value: string): boolean {
  return value.length >= 8
}

export function SignInPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = useMemo(() => sanitizeRedirect(searchParams.get('redirect')), [searchParams])
  const auth = useAuthBootstrap()
  const [mode, setMode] = useState<AuthFormMode>('sign_in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<AuthFormNotice | null>(null)

  const configured = auth.configured
  const signedIn = auth.status !== 'not_configured' && auth.status !== 'signed_out' && Boolean(auth.userContext)
  const submitDisabled = submitting || !configured || !isUsableEmail(email.trim()) || !isUsablePassword(password)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextEmail = email.trim()
    if (!isUsableEmail(nextEmail)) {
      setNotice({
        tone: 'warning',
        title: 'Use a valid email',
        detail: 'Enter the approved internal tester email before continuing.',
      })
      return
    }

    if (!isUsablePassword(password)) {
      setNotice({
        tone: 'warning',
        title: 'Password is too short',
        detail: 'Use at least 8 characters for Supabase email/password auth.',
      })
      return
    }

    setSubmitting(true)
    setNotice(null)

    const result =
      mode === 'sign_in'
        ? await signInWithEmailPassword(nextEmail, password)
        : await signUpWithEmailPassword(nextEmail, password, displayName.trim() || undefined)

    if (!result.ok) {
      setNotice({
        tone: 'error',
        title: mode === 'sign_in' ? 'Sign-in failed' : 'Sign-up failed',
        detail: result.message,
      })
      setSubmitting(false)
      return
    }

    const bootstrap = await auth.refresh()

    if (result.session) {
      setNotice({
        tone: 'success',
        title: 'Signed in',
        detail: bootstrap.ok
          ? 'Your ReEditPro session and workspace context are ready.'
          : `${bootstrap.message} You can still continue to the internal testing entrypoint for read-only checks.`,
      })
      navigate(redirectTo, { replace: true })
      return
    }

    setNotice({
      tone: 'info',
      title: 'Check your email',
      detail: result.message,
    })
    setSubmitting(false)
  }

  async function handleRefresh() {
    const result = await auth.refresh()
    setNotice({
      tone: result.ok ? 'success' : 'info',
      title: result.ok ? 'Session ready' : 'Session check complete',
      detail: result.message,
    })
  }

  async function handleSignOut() {
    await auth.signOut()
    setNotice({
      tone: 'info',
      title: 'Signed out',
      detail: 'This browser no longer has an active Supabase session.',
    })
  }

  return (
    <main className="auth-entry-page">
      <section className="auth-entry-hero" aria-labelledby="sign-in-title">
        <Link className="auth-entry-brand" to="/">
          <span aria-hidden="true">R</span>
          <strong>ReEditPro</strong>
        </Link>

        <div className="auth-entry-copy">
          <Badge accent={configured ? 'cyan' : 'warning'}>
            {configured ? 'Private testing sign-in' : 'Auth configuration required'}
          </Badge>
          <h1 id="sign-in-title">Sign in to test the ReEditPro app.</h1>
          <p>
            Use the approved internal tester email for the owned Supabase project. The landing page stays public;
            this app route owns the session, project access checks, and internal testing entrypoint.
          </p>
        </div>

        <div className="auth-entry-safety-grid" aria-label="Auth safety boundaries">
          <span>
            <ShieldCheck aria-hidden="true" size={16} />
            Frontend anon auth only
          </span>
          <span>
            <LockKeyhole aria-hidden="true" size={16} />
            No service-role secrets
          </span>
          <span>
            <CheckCircle2 aria-hidden="true" size={16} />
            No tool execution on sign-in
          </span>
        </div>
      </section>

      <section className="auth-entry-grid">
        <Card className="auth-entry-card">
          <div className="plan-card-header">
            <div>
              <p className="eyebrow">Account access</p>
              <h2>{mode === 'sign_in' ? 'Sign in' : 'Create tester account'}</h2>
            </div>
            <Badge accent={mode === 'sign_in' ? 'blue' : 'violet'}>
              {mode === 'sign_in' ? 'Existing tester' : 'New tester'}
            </Badge>
          </div>

          {!configured && (
            <div className="auth-entry-notice auth-entry-notice-warning" role="status">
              <strong>Supabase env is missing</strong>
              <p>Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to this app deployment before live sign-in can run.</p>
            </div>
          )}

          {notice && (
            <div className={`auth-entry-notice auth-entry-notice-${notice.tone}`} role="status">
              <strong>{notice.title}</strong>
              <p>{notice.detail}</p>
            </div>
          )}

          <div className="auth-entry-mode-toggle" role="tablist" aria-label="Choose account action">
            <button
              aria-pressed={mode === 'sign_in'}
              className={mode === 'sign_in' ? 'active' : ''}
              onClick={() => setMode('sign_in')}
              type="button"
            >
              Sign in
            </button>
            <button
              aria-pressed={mode === 'sign_up'}
              className={mode === 'sign_up' ? 'active' : ''}
              onClick={() => setMode('sign_up')}
              type="button"
            >
              Create account
            </button>
          </div>

          <form className="auth-entry-form" onSubmit={handleSubmit}>
            {mode === 'sign_up' && (
              <label>
                <span>Display name</span>
                <input
                  autoComplete="name"
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Internal tester"
                  type="text"
                  value={displayName}
                />
              </label>
            )}
            <label>
              <span>Email</span>
              <input
                autoComplete="email"
                inputMode="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@reeditpro.com"
                type="email"
                value={email}
              />
            </label>
            <label>
              <span>Password</span>
              <input
                autoComplete={mode === 'sign_in' ? 'current-password' : 'new-password'}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="8+ characters"
                type="password"
                value={password}
              />
            </label>

            <Button disabled={submitDisabled} icon={mode === 'sign_in' ? ArrowRight : UserPlus} type="submit" variant="primary">
              {submitting ? 'Checking session' : mode === 'sign_in' ? 'Sign in and open testing' : 'Create account'}
            </Button>
          </form>

          <p className="auth-entry-footnote">
            Sign-in does not start generation, run tools, upload media, reserve credits, or call providers.
          </p>
        </Card>

        <div className="auth-entry-side">
          <AuthBootstrapStatusCard
            configured={auth.configured}
            loading={auth.loading}
            onRefresh={handleRefresh}
            onSignOut={handleSignOut}
            status={auth.status}
            userContext={auth.userContext}
            warnings={auth.warnings}
          />

          <Card className="auth-entry-card auth-entry-next-card">
            <div className="plan-card-header">
              <div>
                <p className="eyebrow">After sign-in</p>
                <h3>Continue testing</h3>
              </div>
              <Badge accent={signedIn ? 'success' : 'muted'}>{signedIn ? 'Session found' : 'Waiting'}</Badge>
            </div>
            <p>
              The current safe destination is the internal testing entrypoint. It lets you verify project/session UI,
              Edit Brief, approval gates, and readiness notes without live tool execution.
            </p>
            <div className="auth-entry-actions">
              <Button icon={RefreshCw} onClick={handleRefresh} variant="secondary">
                Refresh session
              </Button>
              <Button icon={ArrowRight} to={redirectTo} variant="primary">
                Open testing
              </Button>
            </div>
            <Link className="auth-entry-secondary-link" to="/dashboard">
              Or open the mock dashboard
            </Link>
          </Card>
        </div>
      </section>
    </main>
  )
}
