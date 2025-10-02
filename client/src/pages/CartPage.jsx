import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet, apiPost, apiDelete, apiPut } from '../lib/api'
import './CartPage.css'

function CartPage() {
  const navigate = useNavigate()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetchCart()
    checkAuthStatus()
  }, [])


  const checkAuthStatus = async () => {
    try {
      // 먼저 로컬 스토리지에서 사용자 정보 확인
      const authData = localStorage.getItem('auth') || sessionStorage.getItem('auth')
      if (authData) {
        const parsed = JSON.parse(authData)
        if (parsed.user) {
          setUser(parsed.user)
          return
        }
      }
      
      // API 호출로 사용자 정보 확인
      const response = await apiGet('/auth/me')
      if (response.success) {
        setUser(response.data)
      }
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error)
      setUser(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('auth')
    sessionStorage.removeItem('auth')
    setUser(null)
    navigate('/')
  }

  const fetchCart = async () => {
    try {
      setLoading(true)
      const response = await apiGet('/cart')
      if (response.success) {
        setCart(response.data)
      }
    } catch (error) {
      console.error('장바구니 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      await handleRemoveItem(itemId)
      return
    }

    try {
      setUpdating(true)
      const response = await apiPut('/cart/item/' + itemId + '/quantity', {
        quantity: newQuantity
      })
      
      if (response.success) {
        setCart(response.data)
      }
    } catch (error) {
      console.error('수량 업데이트 실패:', error)
      alert('수량 업데이트에 실패했습니다.')
    } finally {
      setUpdating(false)
    }
  }

  const handleRemoveItem = async (itemId) => {
    if (!confirm('이 상품을 장바구니에서 제거하시겠습니까?')) {
      return
    }

    try {
      setUpdating(true)
      const response = await apiDelete('/cart/item/' + itemId)
      
      if (response.success) {
        setCart(response.data)
      }
    } catch (error) {
      console.error('상품 제거 실패:', error)
      alert('상품 제거에 실패했습니다.')
    } finally {
      setUpdating(false)
    }
  }

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) {
      alert('장바구니가 비어있습니다.')
      return
    }
    navigate('/checkout')
  }

  if (loading) {
    return (
      <div className="cart-page">
        <div className="cart-loading">
          <div className="loading-spinner">장바구니를 불러오는 중...</div>
        </div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="cart-page">
        {/* Navigation Bar */}
        <div className="cart-navigation">
          <div className="nav-brand">
            <h1>아랑이</h1>
          </div>
          <div className="nav-links">
            <a href="#" className="nav-link">여성</a>
            <a href="#" className="nav-link">남성</a>
            <a href="#" className="nav-link">키즈</a>
            <a href="/" className="nav-link">홈</a>
          </div>
          <div className="nav-actions">
            <button className="continue-shopping-btn" onClick={() => navigate('/')}>
              계속 쇼핑하기
            </button>
            {user && (
              <div className="user-section">
                <span className="welcome-text">{user.name}님 환영합니다</span>
                <button 
                  onClick={() => navigate('/orders')}
                  className="order-history-btn"
                >
                  📋 주문 내역
                </button>
                <button onClick={handleLogout} className="logout-btn">
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="cart-header">
          <h1>Shopping Bag (0)</h1>
          <button className="close-btn" onClick={() => navigate('/')}>×</button>
        </div>
        <div className="cart-empty">
          <h2>장바구니가 비어있습니다</h2>
          <p>쇼핑을 시작해보세요!</p>
          <button className="continue-shopping-btn" onClick={() => navigate('/')}>
            쇼핑 계속하기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      {/* Navigation Bar */}
      <div className="cart-navigation">
        <div className="nav-brand">
          <h1>아랑이</h1>
        </div>
        <div className="nav-links">
          <a href="#" className="nav-link">여성</a>
          <a href="#" className="nav-link">남성</a>
          <a href="#" className="nav-link">키즈</a>
          <a href="/" className="nav-link">홈</a>
        </div>
        <div className="nav-actions">
          <button className="continue-shopping-btn" onClick={() => navigate('/')}>
            계속 쇼핑하기
          </button>
          {user && (
            <div className="user-section">
              <span className="welcome-text">{user.name}님 환영합니다</span>
              <button 
                onClick={() => navigate('/orders')}
                className="order-history-btn"
              >
                📋 주문 내역
              </button>
              <button onClick={handleLogout} className="logout-btn">
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="cart-header">
        <h1>Shopping Bag ({cart.totalItems})</h1>
        <button className="close-btn" onClick={() => navigate('/')}>×</button>
      </div>

      <div className="cart-content">
        <div className="cart-items">
          {cart.items.map((item) => (
            <div key={item._id} className="cart-item">
              <div className="item-image">
                <img 
                  src={item.product.image || 'https://via.placeholder.com/100x100?text=No+Image'} 
                  alt={item.product.name}
                />
              </div>
              
              <div className="item-details">
                <h3 className="item-name">{item.product.name}</h3>
                <p className="item-options">{item.color} • {item.size}</p>
                <p className="item-price">₩{item.price.toLocaleString()}</p>
              </div>

              <div className="item-controls">
                <div className="quantity-controls">
                  <button 
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                    disabled={updating}
                  >
                    -
                  </button>
                  <span className="quantity">{item.quantity}</span>
                  <button 
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                    disabled={updating}
                  >
                    +
                  </button>
                </div>
                <button 
                  className="remove-btn"
                  onClick={() => handleRemoveItem(item._id)}
                  disabled={updating}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <div className="total-section">
            <h3>Total</h3>
            <p className="total-price">₩{cart.totalPrice.toLocaleString()}</p>
          </div>
          <button 
            className="checkout-btn"
            onClick={handleCheckout}
            disabled={updating}
          >
            결제하기
          </button>
        </div>
      </div>
    </div>
  )
}

export default CartPage
