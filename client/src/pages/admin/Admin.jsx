import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiGet, apiPost, apiDelete } from '../../lib/api'
import './Admin.css'

function Admin() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    search: ''
  })
  const [orderFilters, setOrderFilters] = useState({
    search: '',
    status: ''
  })

  // 상품 데이터 가져오기
  const fetchProducts = async () => {
    setLoading(true)
    try {
      const response = await apiGet('/products/all')
      if (response.success) {
        setProducts(response.data || [])
      }
    } catch (error) {
      console.error('상품 데이터 가져오기 실패:', error)
      alert('상품 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 주문 데이터 가져오기
  const fetchOrders = async () => {
    setOrdersLoading(true)
    try {
      const response = await apiGet('/orders')
      console.log('주문 API 응답:', response)
      // API 응답 구조에 따라 데이터 설정
      if (response.items) {
        setOrders(response.items || [])
      } else if (response.data?.items) {
        setOrders(response.data.items || [])
      } else if (Array.isArray(response)) {
        setOrders(response)
      } else {
        setOrders([])
      }
    } catch (error) {
      console.error('주문 데이터 가져오기 실패:', error)
      alert('주문 데이터를 불러오는데 실패했습니다.')
      setOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }

  // 상품 삭제
  const handleDeleteProduct = async (productId) => {
    if (!confirm('정말로 이 상품을 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await apiDelete(`/products/${productId}`)
      
      if (response.success) {
        alert('상품이 성공적으로 삭제되었습니다.')
        fetchProducts() // 목록 새로고침
      } else {
        alert(response.message || '상품 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('상품 삭제 오류:', error)
      alert('상품 삭제 중 오류가 발생했습니다.')
    }
  }

  // 상품 수정 페이지로 이동
  const handleEditProduct = (productId) => {
    navigate(`/admin/product/edit/${productId}`)
  }

  // 필터링된 상품 목록
  const filteredProducts = products.filter(product => {
    const matchesCategory = !filters.category || product.category === filters.category
    const matchesStatus = !filters.status || 
      (filters.status === 'active' && product.isActive) ||
      (filters.status === 'inactive' && !product.isActive)
    const matchesSearch = !filters.search || 
      product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      product.sku.toLowerCase().includes(filters.search.toLowerCase())
    
    return matchesCategory && matchesStatus && matchesSearch
  })

  // 필터링된 주문 목록
  const filteredOrders = orders.filter(order => {
    const matchesSearch = !orderFilters.search || 
      (order.orderNumber && order.orderNumber.toLowerCase().includes(orderFilters.search.toLowerCase())) ||
      (order.shipping?.receiverName && order.shipping.receiverName.toLowerCase().includes(orderFilters.search.toLowerCase()))
    const matchesStatus = !orderFilters.status || order.status === orderFilters.status
    
    return matchesSearch && matchesStatus
  })

  // 탭이 활성화될 때 데이터 가져오기
  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts()
    } else if (activeTab === 'orders') {
      fetchOrders()
    }
  }, [activeTab])

  const summaryCards = [
    {
      title: '총 매출',
      value: '₩1,258,400',
      change: '+5.4%',
      changeType: 'positive',
      icon: '💰'
    },
    {
      title: '총 주문',
      value: '1,280',
      change: '-2.1%',
      changeType: 'negative',
      icon: '🛒'
    },
    {
      title: '총 상품',
      value: '542',
      change: '+1.2%',
      changeType: 'positive',
      icon: '📦'
    },
    {
      title: '총 고객',
      value: '8,452',
      change: '+10%',
      changeType: 'positive',
      icon: '👥'
    }
  ]

  const recentOrders = [
    {
      id: 'ORD001',
      customer: '김민준',
      date: '2024-07-21',
      amount: '150,000원',
      status: '완료',
      statusType: 'completed'
    },
    {
      id: 'ORD002',
      customer: '이서연',
      date: '2024-07-21',
      amount: '25,500원',
      status: '대기중',
      statusType: 'pending'
    },
    {
      id: 'ORD003',
      customer: '박도윤',
      date: '2024-07-20',
      amount: '320,750원',
      status: '완료',
      statusType: 'completed'
    },
    {
      id: 'ORD004',
      customer: '최지우',
      date: '2024-07-20',
      amount: '89,900원',
      status: '취소됨',
      statusType: 'cancelled'
    },
    {
      id: 'ORD005',
      customer: '정하은',
      date: '2024-07-19',
      amount: '512,000원',
      status: '완료',
      statusType: 'completed'
    }
  ]

  const renderDashboard = () => (
    <div className="dashboard-content">
      <h1 className="page-title">대시보드</h1>
      
      {/* Summary Cards */}
      <div className="summary-cards">
        {summaryCards.map((card, index) => (
          <div key={index} className="summary-card">
            <div className="card-icon">{card.icon}</div>
            <div className="card-content">
              <h3 className="card-title">{card.title}</h3>
              <div className="card-value">{card.value}</div>
              <div className={`card-change ${card.changeType}`}>
                {card.changeType === 'positive' ? '▲' : '▼'} {card.change} 지난 달 대비
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="recent-orders">
        <h2 className="section-title">최근 주문</h2>
        <div className="table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>주문 ID</th>
                <th>고객</th>
                <th>날짜</th>
                <th>금액</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order, index) => (
                <tr key={index}>
                  <td>{order.id}</td>
                  <td>{order.customer}</td>
                  <td>{order.date}</td>
                  <td>{order.amount}</td>
                  <td>
                    <span className={`status-badge ${order.statusType}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sales Analysis */}
      <div className="sales-analysis">
        <h2 className="section-title">매출 분석</h2>
        <div className="chart-container">
          <div className="bar-chart">
            <div className="bar" style={{ height: '60%' }}></div>
            <div className="bar" style={{ height: '80%' }}></div>
            <div className="bar" style={{ height: '45%' }}></div>
            <div className="bar" style={{ height: '90%' }}></div>
            <div className="bar" style={{ height: '70%' }}></div>
            <div className="bar" style={{ height: '85%' }}></div>
          </div>
        </div>
      </div>
    </div>
  )

  // 주문 상태별 색상 정의
  const getOrderStatusColor = (status) => {
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

  // 주문 상태 한글 변환
  const getOrderStatusLabel = (status) => {
    const labels = {
      created: '주문완료',
      pending_payment: '결제대기',
      paid: '결제완료',
      preparing: '상품준비중',
      shipped: '배송중',
      delivered: '배송완료',
      completed: '구매확정',
      canceled: '주문취소',
      refunded: '환불완료'
    }
    return labels[status] || status
  }

  // 주문 상태 정의 (Admin 페이지용 - 7가지)
  const ORDER_STATUSES = [
    { key: 'all', label: '전체', value: null },
    { key: 'created', label: '주문확인', value: 'created' },
    { key: 'preparing', label: '상품준비중', value: 'preparing' },
    { key: 'ready', label: '배송시작', value: 'ready' },
    { key: 'shipped', label: '배송중', value: 'shipped' },
    { key: 'delivered', label: '배송완료', value: 'delivered' },
    { key: 'canceled', label: '주문취소', value: 'canceled' }
  ]

  const renderOrders = () => (
    <div className="orders-content">
      <div className="orders-header">
        <h1 className="page-title">주문 관리</h1>
      </div>
      
      <div className="orders-filters">
        <div className="filter-group" style={{ flex: 1 }}>
          <div className="search-input-wrapper">
            <input 
              type="text" 
              placeholder="주문번호 또는 고객명 검색..." 
              className="search-input"
              value={orderFilters.search}
              onChange={(e) => setOrderFilters({...orderFilters, search: e.target.value})}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                }
              }}
            />
            <button 
              type="button" 
              className="search-btn"
              onClick={() => { /* 입력형 필터 즉시 반영이라 별도 동작 없음 */ }}
              title="검색"
            >
              🔍 검색
            </button>
          </div>
        </div>
      </div>

      

      <div className="orders-table-container">
        {ordersLoading ? (
          <div className="loading-container">
            <p>주문 데이터를 불러오는 중...</p>
          </div>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>주문번호</th>
                <th>고객명</th>
                <th>주문일시</th>
                <th>상품</th>
                <th>금액</th>
                <th>상태</th>
                <th>배송지</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-data">
                    {orders.length === 0 ? '등록된 주문이 없습니다.' : '검색 조건에 맞는 주문이 없습니다.'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const statusColor = getOrderStatusColor(order.status)
                  return (
                    <tr key={order._id}>
                      <td>{order.orderNumber || order._id}</td>
                      <td>{order.shipping?.receiverName || '-'}</td>
                      <td>{new Date(order.createdAt).toLocaleString()}</td>
                      <td>
                        <div className="order-items">
                          {order.items?.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="order-item">
                              <img 
                                src={item.product?.image || 'https://via.placeholder.com/30x30?text=IMG'} 
                                alt={item.product?.name}
                                className="item-thumbnail"
                              />
                              <span className="item-name">{item.product?.name}</span>
                              <span className="item-quantity">x{item.quantity}</span>
                            </div>
                          ))}
                          {order.items?.length > 2 && (
                            <div className="more-items">+{order.items.length - 2}개 더</div>
                          )}
                        </div>
                      </td>
                      <td>₩{order.total?.toLocaleString()}</td>
                      <td>
                        <span 
                          className="status-badge" 
                          style={{ 
                            background: statusColor.bg, 
                            color: statusColor.color 
                          }}
                        >
                          {getOrderStatusLabel(order.status)}
                        </span>
                      </td>
                      <td>
                        <div className="shipping-info">
                          <div>{order.shipping?.address1}</div>
                          <div className="shipping-phone">{order.shipping?.receiverPhone}</div>
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-view"
                            onClick={() => navigate(`/orders/${order._id}`)}
                          >
                            상세보기
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )

  const renderProducts = () => (
    <div className="products-content">
      <div className="products-header">
        <h1 className="page-title">상품 관리</h1>
        <button 
          className="add-product-btn"
          onClick={() => navigate('/admin/product/new')}
        >
          + 새 상품 등록
        </button>
      </div>
      
      <div className="products-stats">
        <div className="stat-card">
          <h3>총 상품</h3>
          <p className="stat-number">{products.length}</p>
        </div>
        <div className="stat-card">
          <h3>활성 상품</h3>
          <p className="stat-number">{products.filter(p => p.isActive).length}</p>
        </div>
        <div className="stat-card">
          <h3>품절 상품</h3>
          <p className="stat-number">{products.filter(p => p.stock === 0).length}</p>
        </div>
      </div>

      <div className="products-filters">
        <div className="filter-group">
          <label>카테고리:</label>
          <select 
            className="filter-select"
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
          >
            <option value="">전체</option>
            <option value="상의">상의</option>
            <option value="하의">하의</option>
            <option value="악세사리">악세사리</option>
          </select>
        </div>
        <div className="filter-group">
          <label>상태:</label>
          <select 
            className="filter-select"
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="">전체</option>
            <option value="active">활성</option>
            <option value="inactive">비활성</option>
          </select>
        </div>
        <div className="filter-group">
          <input 
            type="text" 
            placeholder="상품명 또는 SKU 검색..." 
            className="search-input"
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
        </div>
      </div>

      <div className="products-table-container">
        {loading ? (
          <div className="loading-container">
            <p>상품 데이터를 불러오는 중...</p>
          </div>
        ) : (
          <table className="products-table">
            <thead>
              <tr>
                <th>이미지</th>
                <th>상품명</th>
                <th>SKU</th>
                <th>카테고리</th>
                <th>가격</th>
                <th>재고</th>
                <th>상태</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-data">
                    {products.length === 0 ? '등록된 상품이 없습니다.' : '검색 조건에 맞는 상품이 없습니다.'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className="product-image">
                        <img 
                          src={product.image || 'https://via.placeholder.com/50x50?text=IMG'} 
                          alt={product.name}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/50x50?text=IMG'
                          }}
                        />
                      </div>
                    </td>
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td>{product.category}</td>
                    <td>₩{product.price?.toLocaleString()}</td>
                    <td>{product.stock}</td>
                    <td>
                      <span className={`status-badge ${product.isActive ? 'active' : 'inactive'}`}>
                        {product.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-edit"
                          onClick={() => handleEditProduct(product._id)}
                        >
                          수정
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteProduct(product._id)}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard()
      case 'orders':
        return renderOrders()
      case 'products':
        return renderProducts()
      case 'customers':
        return <div className="page-content"><h1>고객 관리</h1></div>
      default:
        return renderDashboard()
    }
  }

  return (
    <div className="admin-layout">
      {/* Top Bar */}
      <div className="top-bar">
        <h1 className="top-title">Arang</h1>
        <div className="top-actions">
          <button className="action-btn">📱</button>
          <button className="action-btn">🔄</button>
          <button className="action-btn">⛶</button>
        </div>
      </div>

      <div className="admin-container">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>관리자 패널</h2>
          </div>
          
          <nav className="sidebar-nav">
            <button 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <span className="nav-icon">⬜</span>
              대시보드
            </button>
            
            <button 
              className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <span className="nav-icon">🛍️</span>
              주문
            </button>
            
            <button 
              className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              <span className="nav-icon">🏷️</span>
              상품
            </button>
            
            <button 
              className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`}
              onClick={() => setActiveTab('customers')}
            >
              <span className="nav-icon">👥</span>
              고객
            </button>
          </nav>

          <div className="sidebar-footer">
            <Link to="/" className="return-link">
              <span className="nav-icon">🛒</span>
              쇼핑몰로 돌아가기
              <span className="arrow">→</span>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default Admin
