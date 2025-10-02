import { useLocation, useNavigate } from 'react-router-dom'

function OrderFail() {
  const navigate = useNavigate()
  const location = useLocation()
  const message = location.state?.message || '주문 처리 중 오류가 발생했습니다.'

  return (
    <div style={{ maxWidth: 720, margin: '32px auto', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: 999, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: 28, fontWeight: 800 }}>✕</div>
          <div>
            <h1 style={{ margin: 0 }}>주문에 실패했습니다</h1>
            <p style={{ margin: '6px 0', color: '#555' }}>{message}</p>
          </div>
        </div>
        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('/checkout')} style={{ flex: 1, padding: '12px 16px', borderRadius: 10, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>다시 시도</button>
          <button onClick={() => navigate('/')} style={{ flex: 1, padding: '12px 16px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' }}>홈으로</button>
        </div>
      </div>
    </div>
  )
}

export default OrderFail


