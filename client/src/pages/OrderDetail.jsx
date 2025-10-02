import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiGet } from '../lib/api'

function formatCurrency(n) {
  try { return '₩' + Number(n || 0).toLocaleString() } catch { return '₩0' }
}

// 주문 상태 정의
const ORDER_STATUSES = [
  { key: 'all', label: '전체', value: null },
  { key: 'created', label: '주문완료', value: 'created' },
  { key: 'pending_payment', label: '결제대기', value: 'pending_payment' },
  { key: 'paid', label: '결제완료', value: 'paid' },
  { key: 'preparing', label: '상품준비중', value: 'preparing' },
  { key: 'shipped', label: '배송중', value: 'shipped' },
  { key: 'delivered', label: '배송완료', value: 'delivered' },
  { key: 'completed', label: '구매확정', value: 'completed' },
  { key: 'canceled', label: '주문취소', value: 'canceled' },
  { key: 'refunded', label: '환불완료', value: 'refunded' }
]

// 주문 상태별 색상 정의
function getStatusColor(status) {
  const colors = {
    created: { bg: '#e3f2fd', color: '#1976d2' },
    pending_payment: { bg: '#fff3e0', color: '#f57c00' },
    paid: { bg: '#e8f5e8', color: '#388e3c' },
    preparing: { bg: '#f3e5f5', color: '#7b1fa2' },
    shipped: { bg: '#e0f2f1', color: '#00796b' },
    delivered: { bg: '#e8f5e8', color: '#2e7d32' },
    completed: { bg: '#e8f5e8', color: '#1b5e20' },
    canceled: { bg: '#ffebee', color: '#d32f2f' },
    refunded: { bg: '#fce4ec', color: '#c2185b' }
  }
  return colors[status] || { bg: '#f5f5f5', color: '#666' }
}

function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [orders, setOrders] = useState([])
  const [allOrders, setAllOrders] = useState([]) // 전체 주문 목록 저장
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  // 주문 상태별 갯수 계산
  const getStatusCounts = (orders) => {
    const counts = {}
    ORDER_STATUSES.forEach(status => {
      if (status.value === null) {
        counts[status.key] = orders.length // 전체 갯수
      } else {
        counts[status.key] = orders.filter(order => order.status === status.value).length
      }
    })
    return counts
  }

  // 주문 목록 가져오기
  const fetchOrders = async (status = null) => {
    try {
      setOrdersLoading(true)
      const params = status ? `?status=${status}` : ''
      const data = await apiGet(`/orders${params}`)
      const orderItems = data.items || []
      setOrders(orderItems)
      
      // 전체 주문 목록도 함께 저장 (갯수 계산용)
      if (status === null) {
        setAllOrders(orderItems)
      }
    } catch (e) {
      console.error('주문 목록을 불러오지 못했습니다:', e)
      setOrders([])
      setAllOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }

  // 탭 클릭 핸들러
  const handleTabClick = (tabKey) => {
    setActiveTab(tabKey)
    const status = ORDER_STATUSES.find(s => s.key === tabKey)?.value
    fetchOrders(status)
  }

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setError('')
        const data = await apiGet(`/orders/${id}`)
        setOrder(data)
      } catch (e) {
        setError('주문 정보를 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  // 컴포넌트 마운트 시 전체 주문 목록 로드
  useEffect(() => {
    fetchOrders()
  }, [])

  const totals = useMemo(() => {
    if (!order) return { subtotal: 0, tax: 0, total: 0 }
    const subtotal = (order.items || []).reduce((sum, it) => sum + (it.quantity * (it.price || it.product?.price || 0)), 0)
    return { subtotal, tax: order.tax || 0, total: order.total || 0 }
  }, [order])

  if (loading) return <div style={{ maxWidth: 860, margin: '32px auto', padding: 24 }}>로딩 중...</div>
  if (error) return <div style={{ maxWidth: 860, margin: '32px auto', padding: 24 }}>{error}</div>
  if (!order) return null

  return (
    <div style={{ maxWidth: 860, margin: '32px auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>주문 관리</h1>
        <button onClick={() => navigate(-1)} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8, background: '#fff' }}>뒤로</button>
      </div>

      {/* 주문 상태 탭 */}
      <div style={{ marginTop: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
          {ORDER_STATUSES.map((status) => {
            const counts = getStatusCounts(allOrders)
            const count = counts[status.key] || 0
            return (
              <button
                key={status.key}
                onClick={() => handleTabClick(status.key)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  background: activeTab === status.key ? '#007bff' : '#fff',
                  color: activeTab === status.key ? '#fff' : '#333',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontSize: 14,
                  fontWeight: activeTab === status.key ? 600 : 400,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>{status.label}</span>
                <span style={{
                  background: activeTab === status.key ? 'rgba(255,255,255,0.2)' : '#f0f0f0',
                  color: activeTab === status.key ? '#fff' : '#666',
                  padding: '2px 6px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                  minWidth: 20,
                  textAlign: 'center'
                }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 주문 목록 */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>주문 목록</h2>
        {ordersLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>로딩 중...</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
            해당 상태의 주문이 없습니다.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {orders.map((orderItem) => (
              <div
                key={orderItem._id}
                style={{
                  border: '1px solid #eee',
                  borderRadius: 12,
                  padding: 16,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: orderItem._id === id ? '#f8f9ff' : '#fff'
                }}
                onClick={() => navigate(`/orders/${orderItem._id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      주문번호: {orderItem.orderNumber || orderItem._id}
                    </div>
                    <div style={{ color: '#666', fontSize: 14 }}>
                      {new Date(orderItem.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      background: getStatusColor(orderItem.status).bg,
                      color: getStatusColor(orderItem.status).color
                    }}>
                      {ORDER_STATUSES.find(s => s.value === orderItem.status)?.label || orderItem.status}
                    </div>
                    <div style={{ fontWeight: 600, marginTop: 4 }}>
                      {formatCurrency(orderItem.total)}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {(orderItem.items || []).slice(0, 3).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img
                        src={item.product?.image}
                        alt={item.product?.name}
                        style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, background: '#f6f6f6' }}
                      />
                      <div style={{ fontSize: 13 }}>
                        <div style={{ fontWeight: 500 }}>{item.product?.name}</div>
                        <div style={{ color: '#666' }}>수량: {item.quantity}</div>
                      </div>
                    </div>
                  ))}
                  {(orderItem.items || []).length > 3 && (
                    <div style={{ color: '#666', fontSize: 13 }}>
                      외 {(orderItem.items || []).length - 3}개
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 현재 선택된 주문 상세 정보 */}
      <div style={{ marginTop: 16, border: '1px solid #eee', borderRadius: 12, padding: 16 }}>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>주문 상세 정보</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          <div><b>주문 번호</b> {order.orderNumber || order._id}</div>
          <div><b>주문 일시</b> {new Date(order.createdAt || Date.now()).toLocaleString()}</div>
          <div><b>상태</b> 
            <span style={{
              marginLeft: 8,
              padding: '4px 8px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              background: getStatusColor(order.status).bg,
              color: getStatusColor(order.status).color
            }}>
              {ORDER_STATUSES.find(s => s.value === order.status)?.label || order.status}
            </span>
          </div>
          <div><b>수령인</b> {order.shipping?.receiverName} ({order.shipping?.receiverPhone})</div>
          <div><b>주소</b> {order.shipping?.address1} {order.shipping?.address2} ({order.shipping?.postalCode})</div>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <h2 style={{ marginTop: 0 }}>상품</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {(order.items || []).map((it, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f3f3', padding: '8px 0' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <img src={it.product?.image} alt={it.product?.name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, background: '#f6f6f6' }} />
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
            <span>세금</span>
            <span>{formatCurrency(totals.tax)}</span>
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
    </div>
  )
}

export default OrderDetail


