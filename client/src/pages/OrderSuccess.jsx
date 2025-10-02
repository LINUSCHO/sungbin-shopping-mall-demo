import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { apiGet } from '../lib/api'

function formatCurrency(n) {
  try { return '₩' + Number(n || 0).toLocaleString() } catch { return '₩0' }
}

function maskCard(cardNameOrNumber) {
  if (!cardNameOrNumber) return '결제수단 미상'
  if (String(cardNameOrNumber).includes('*')) return cardNameOrNumber
  return `신용카드 (**** **** **** ${String(cardNameOrNumber).slice(-4)})`
}

function OrderSuccess() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const [order, setOrder] = useState(location.state?.order || null)
  const [loading, setLoading] = useState(!location.state?.order)

  useEffect(() => {
    if (order) return
    ;(async () => {
      try {
        setLoading(true)
        const data = await apiGet(`/orders/${id}`)
        setOrder(data)
      } catch (_) {
      } finally {
        setLoading(false)
      }
    })()
  }, [id, order])

  const totals = useMemo(() => {
    if (!order) return { subtotal: 0 }
    const subtotal = (order.items || []).reduce((sum, it) => sum + (it.quantity * (it.price || it.product?.price || 0)), 0)
    return { subtotal }
  }, [order])

  if (loading || !order) {
    return <div style={{ maxWidth: 860, margin: '32px auto', padding: 24 }}>주문 정보를 불러오는 중...</div>
  }

  return (
    <div style={{ maxWidth: 860, margin: '32px auto', padding: 24 }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 24,
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 999,
            background: '#e8f9ef', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#12b76a', fontSize: 28, fontWeight: 800
          }}>✓</div>
          <div>
            <h1 style={{ margin: 0 }}>주문이 성공적으로 완료되었습니다!</h1>
            <p style={{ margin: '6px 0', color: '#555' }}>주문해 주셔서 감사합니다. 주문 내역이 이메일로 발송되었습니다.</p>
          </div>
        </div>

        <div style={{ marginTop: 20, border: '1px solid #eee', borderRadius: 12, padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>주문 요약</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <div style={{ color: '#777', fontSize: 13 }}>주문 번호</div>
              <div style={{ fontWeight: 700 }}>{order.orderNumber || order._id}</div>
            </div>
            <div>
              <div style={{ color: '#777', fontSize: 13 }}>주문 날짜</div>
              <div>{new Date(order.createdAt || Date.now()).toLocaleDateString()}</div>
            </div>
            <div>
              <div style={{ color: '#777', fontSize: 13 }}>배송지</div>
              <div>
                {order.shipping?.receiverName}<br />
                {order.shipping?.address1} {order.shipping?.address2} ({order.shipping?.postalCode})
              </div>
            </div>
            <div>
              <div style={{ color: '#777', fontSize: 13 }}>결제 수단</div>
              <div>{maskCard(order.payment?.card_name || order.payment?.transactionId)}</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <h2 style={{ marginTop: 0 }}>주문 상품</h2>
          <div style={{ display: 'grid', gap: 16 }}>
            {(order.items || []).map((it, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f1f1' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <img src={it.product?.image} alt={it.product?.name} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, background: '#f6f6f6' }} />
                  <div>
                    <div style={{ fontWeight: 700 }}>{it.product?.name}</div>
                    <div style={{ color: '#777', fontSize: 13 }}>수량: {it.quantity}</div>
                  </div>
                </div>
                <div style={{ fontWeight: 700 }}>{formatCurrency((it.price || it.product?.price || 0) * it.quantity)}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
              <span>상품 합계</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', marginTop: 4 }}>
              <span>배송비</span>
              <span>{order.shipping?.fee ? formatCurrency(order.shipping.fee) : '무료'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, marginTop: 8 }}>
              <span>총 결제 금액</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('/orders/' + order._id)} style={{
            flex: 1, padding: '12px 16px', borderRadius: 10, border: '1px solid #ddd', background: '#fff', cursor: 'pointer'
          }}>주문 내역 보기</button>
          <button onClick={() => navigate('/')} style={{
            flex: 1, padding: '12px 16px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer'
          }}>쇼핑 계속하기</button>
        </div>
      </div>
    </div>
  )
}

export default OrderSuccess


