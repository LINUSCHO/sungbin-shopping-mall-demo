import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Signup.css'

const API_BASE = 'http://localhost:5001/api'

function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    user_type: 'customer',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [consents, setConsents] = useState({ terms: false, privacy: false, marketing: false })
  const [allAgree, setAllAgree] = useState(false)

  // 이미 로그인된 상태면 홈으로 리다이렉트
  useEffect(() => {
    try {
      const raw = localStorage.getItem('auth') || sessionStorage.getItem('auth')
      if (raw) {
        const stored = JSON.parse(raw)
        if (stored?.tokens?.accessToken) {
          navigate('/')
        }
      }
    } catch (_) {}
  }, [navigate])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleConsentChange(e) {
    const { name, checked } = e.target
    const next = { ...consents, [name]: checked }
    setConsents(next)
    const every = next.terms && next.privacy && next.marketing
    setAllAgree(every)
  }

  function handleAllAgreeChange(e) {
    const { checked } = e.target
    setAllAgree(checked)
    setConsents({ terms: checked, privacy: checked, marketing: checked })
  }

  function isValidPassword(pw) {
    if (!pw || pw.length < 8) return false
    const hasLetter = /[A-Za-z]/.test(pw)
    const hasNumber = /[0-9]/.test(pw)
    const hasSpecial = /[^A-Za-z0-9]/.test(pw)
    return hasLetter && hasNumber && hasSpecial
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      if (!consents.terms || !consents.privacy) {
        throw new Error('필수 약관에 동의해 주세요.')
      }
      if (!isValidPassword(form.password)) {
        throw new Error('비밀번호 정책을 확인해 주세요.')
      }
      if (form.password !== form.confirmPassword) {
        throw new Error('비밀번호가 일치하지 않습니다.')
      }

      const payload = {
        email: form.email,
        name: form.name.trim(),
        password: form.password,
        user_type: 'customer',
      }

      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        throw new Error(`POST /users failed: ${res.status}`)
      }
      await res.json()
      setSuccess('회원가입이 완료되었습니다.')
      setForm({ name: '', email: '', password: '', confirmPassword: '', user_type: 'customer' })
      setConsents({ terms: false, privacy: false, marketing: false })
      setAllAgree(false)
      
      // 회원가입 완료 후 홈페이지로 이동
      setTimeout(() => {
        navigate('/')
      }, 1500) // 1.5초 후 이동
    } catch (err) {
      if (String(err.message).includes('409')) {
        setError('이미 존재하는 이메일입니다.')
      } else {
        setError(err.message || '회원가입에 실패했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: '40px auto', padding: 24 }}>
      <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, textAlign: 'center' }}>회원가입</h1>
      <p style={{ textAlign: 'center', color: '#666', marginTop: 8 }}>새로운 계정을 만들어 쇼핑을 시작하세요</p>
      <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>이름</label>
          <input name="name" placeholder="이름" value={form.name} onChange={handleChange} required style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8 }} />
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>이메일</label>
          <input name="email" type="email" placeholder="your@email.com" value={form.email} onChange={handleChange} required style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8 }} />
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>비밀번호</label>
          <input 
            name="password" 
            type="password" 
            placeholder="비밀번호를 입력하세요" 
            value={form.password} 
            onChange={handleChange} 
            required 
            className={`password-input ${form.password && !isValidPassword(form.password) ? 'invalid' : ''}`}
          />
          {form.password && !isValidPassword(form.password) && (
            <div className="password-error">
              8자 이상, 영문, 숫자, 특수문자 포함
            </div>
          )}
          {form.password && isValidPassword(form.password) && (
            <div className="password-success">
              ✓ 비밀번호가 유효합니다
            </div>
          )}
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>비밀번호 확인</label>
          <input 
            name="confirmPassword" 
            type="password" 
            placeholder="비밀번호를 다시 입력하세요" 
            value={form.confirmPassword} 
            onChange={handleChange} 
            required 
            className={`password-input ${form.password && form.confirmPassword && form.password !== form.confirmPassword ? 'invalid' : ''}`}
          />
          {form.password && form.confirmPassword && form.password !== form.confirmPassword && (
            <div className="password-error">
              비밀번호가 일치하지 않습니다.
            </div>
          )}
          {form.password && form.confirmPassword && form.password === form.confirmPassword && isValidPassword(form.password) && (
            <div className="password-success">
              ✓ 비밀번호가 일치합니다
            </div>
          )}
        </div>

        <hr style={{ margin: '20px 0', border: 0, borderTop: '1px solid #eee' }} />

        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={allAgree} onChange={handleAllAgreeChange} /> 전체 동의
          </label>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" name="terms" checked={consents.terms} onChange={handleConsentChange} /> 이용약관 동의 (필수)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" name="privacy" checked={consents.privacy} onChange={handleConsentChange} /> 개인정보처리방침 동의 (필수)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" name="marketing" checked={consents.marketing} onChange={handleConsentChange} /> 마케팅 정보 수신 동의 (선택)
          </label>
        </div>


        {error && <p style={{ color: 'crimson', marginTop: 12 }}>{error}</p>}
        {success && <p style={{ color: 'seagreen', marginTop: 12 }}>{success}</p>}

        <button
          type="submit"
          disabled={
            loading ||
            !form.name ||
            !form.email ||
            !form.password ||
            !form.confirmPassword ||
            !consents.terms ||
            !consents.privacy ||
            !isValidPassword(form.password) ||
            form.password !== form.confirmPassword
          }
          style={{ width: '100%', padding: 14, marginTop: 16, borderRadius: 8, background: '#333', color: '#fff', border: 'none', cursor: 'pointer', opacity: (loading || !consents.terms || !consents.privacy) ? 0.7 : 1 }}
        >
          {loading ? '처리 중…' : '회원가입'}
        </button>
      </form>
    </div>
  )
}

export default Signup


