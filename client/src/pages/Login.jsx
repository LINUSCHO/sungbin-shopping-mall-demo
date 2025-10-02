import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiPost } from '../lib/api'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [keepSignedIn, setKeepSignedIn] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  console.log('Login 컴포넌트가 렌더링되었습니다.')

  // 이미 로그인된 상태면 홈으로 리다이렉트 (토큰 유효성 검증 포함)
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const raw = localStorage.getItem('auth') || sessionStorage.getItem('auth')
        if (raw) {
          const stored = JSON.parse(raw)
          if (stored?.tokens?.accessToken) {
            // 토큰 유효성 검증
            try {
              const response = await fetch('/api/auth/me', {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${stored.tokens.accessToken}`,
                },
              })
              
              if (response.ok) {
                // 토큰이 유효하면 홈으로 리다이렉트
                navigate('/')
              } else {
                // 토큰이 만료되었거나 유효하지 않으면 저장된 인증 정보 삭제
                localStorage.removeItem('auth')
                sessionStorage.removeItem('auth')
                console.log('만료된 토큰으로 인해 로그인 상태가 초기화되었습니다.')
              }
            } catch (error) {
              // API 호출 실패 시 저장된 인증 정보 삭제
              localStorage.removeItem('auth')
              sessionStorage.removeItem('auth')
              console.log('토큰 검증 실패로 로그인 상태가 초기화되었습니다.')
            }
          }
        }
      } catch (error) {
        // JSON 파싱 오류 등으로 저장된 인증 정보 삭제
        localStorage.removeItem('auth')
        sessionStorage.removeItem('auth')
        console.log('인증 정보 파싱 오류로 로그인 상태가 초기화되었습니다.')
      }
    }
    
    checkAuthStatus()
  }, [navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await apiPost('/auth/login', { email, password, keepSignedIn })
      if (res?.user && res?.tokens?.accessToken) {
        const storage = keepSignedIn ? window.localStorage : window.sessionStorage
        const authPayload = {
          user: res.user,
          tokens: res.tokens,
          loggedInAt: Date.now()
        }
        storage.setItem('auth', JSON.stringify(authPayload))
        navigate('/')
        return
      }
      setError('로그인에 실패했습니다. 잠시 후 다시 시도하세요.')
    } catch (err) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1 className="brand">LUXE</h1>
        <h2 className="title">로그인</h2>
        <p className="subtitle">계정에 로그인하여 쇼핑을 시작하세요</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="label">이메일</label>
          <div className="input with-icon">
            <span className="icon">✉️</span>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <label className="label">비밀번호</label>
          <div className="input with-icon">
            <span className="icon">🔒</span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="button" className="eye" onClick={() => setShowPassword(v => !v)}>
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          <div className="row between">
            <label className="checkbox">
              <input type="checkbox" checked={keepSignedIn} onChange={(e) => setKeepSignedIn(e.target.checked)} />
              <span>로그인 상태 유지</span>
            </label>
            <Link to="#" className="link">비밀번호 찾기</Link>
          </div>

          {error && <div className="error">{error}</div>}

          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="divider"><span>또는</span></div>

        <div className="oauth">
          <button className="btn ghost">G Google로 로그인</button>
          <button className="btn ghost">f Facebook으로 로그인</button>
          <button className="btn ghost"> Apple로 로그인</button>
        </div>

        <p className="foot">아직 계정이 없으신가요? <Link to="/signup" className="link">회원가입</Link></p>
      </div>
    </div>
  )
}

export default Login


