import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

function OrderList() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [allOrders, setAllOrders] = useState([]) // 전체 주문 목록 저장
  const [loading, setLoading] = useState(true)
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
      setLoading(true)
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
      setLoading(false)
    }
  }

  // 탭 클릭 핸들러
  const handleTabClick = (tabKey) => {
    setActiveTab(tabKey)
    const status = ORDER_STATUSES.find(s => s.key === tabKey)?.value
    fetchOrders(status)
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: '32px auto', padding: 24, textAlign: 'center' }}>
        로딩 중...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: '32px auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>주문 내역</h1>
        <button 
          onClick={() => navigate('/')} 
          style={{ 
            padding: '8px 16px', 
            border: '1px solid #ddd', 
            borderRadius: 8, 
            background: '#fff',
            cursor: 'pointer'
          }}
        >
          홈으로
        </button>
      </div>

      {/* 주문 상태 탭 */}
      <div style={{ marginBottom: 24 }}>
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
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
          <h3>주문 내역이 없습니다</h3>
          <p>첫 주문을 시작해보세요!</p>
          <button 
            onClick={() => navigate('/')}
            style={{
              marginTop: 16,
              padding: '12px 24px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 16
            }}
          >
            쇼핑하기
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {orders.map((order) => (
            <div
              key={order._id}
              style={{
                border: '1px solid #eee',
                borderRadius: 12,
                padding: 20,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: '#fff'
              }}
              onClick={() => navigate(`/orders/${order._id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 18 }}>
                    주문번호: {order.orderNumber || order._id}
                  </div>
                  <div style={{ color: '#666', fontSize: 14 }}>
                    {new Date(order.createdAt).toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    background: getStatusColor(order.status).bg,
                    color: getStatusColor(order.status).color,
                    marginBottom: 8
                  }}>
                    {ORDER_STATUSES.find(s => s.value === order.status)?.label || order.status}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 18 }}>
                    {formatCurrency(order.total)}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                {(order.items || []).slice(0, 4).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img
                      src={item.product?.image}
                      alt={item.product?.name}
                      style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 6, background: '#f6f6f6' }}
                    />
                    <div style={{ fontSize: 14 }}>
                      <div style={{ fontWeight: 500 }}>{item.product?.name}</div>
                      <div style={{ color: '#666' }}>수량: {item.quantity}</div>
                    </div>
                  </div>
                ))}
                {(order.items || []).length > 4 && (
                  <div style={{ color: '#666', fontSize: 14 }}>
                    외 {(order.items || []).length - 4}개
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default OrderList
