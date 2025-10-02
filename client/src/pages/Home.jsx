import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { apiGet } from '../lib/api'
import './Home.css'

function Home() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [cartItemCount, setCartItemCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)

  // user 상태 변경 디버깅
  useEffect(() => {
    console.log('사용자 상태 변경:', user)
  }, [user])

  useEffect(() => {
    console.log('Home 컴포넌트가 마운트되었습니다.')
    checkAuthStatus()
    fetchProducts()
    fetchCartCount()
  }, [])

  useEffect(() => {
    if (user) {
      fetchCartCount()
    }
  }, [user])

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.user-dropdown')) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  const checkAuthStatus = async () => {
    try {
      const raw = localStorage.getItem('auth') || sessionStorage.getItem('auth')
      if (!raw) {
        setLoading(false)
        return
      }
      
      const stored = JSON.parse(raw)
      const token = stored?.tokens?.accessToken
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      setProductsLoading(true)
      const response = await apiGet('/products')
      if (response.success) {
        setProducts(response.data)
      }
    } catch (error) {
      console.error('제품 조회 실패:', error)
    } finally {
      setProductsLoading(false)
    }
  }

  const fetchCartCount = async () => {
    try {
      const response = await apiGet('/cart/count')
      if (response.success) {
        setCartItemCount(response.data.count)
      }
    } catch (error) {
      console.error('장바구니 개수 조회 실패:', error)
      setCartItemCount(0)
    }
  }

  const handleLogout = () => {
    try {
      localStorage.removeItem('auth')
      sessionStorage.removeItem('auth')
      setUser(null)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>로딩 중...</div>
  }

  return (
    <div className="home-page">

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <span className="logout-text"></span>
            <h1 className="brand-name">아랑이</h1>
          </div>
          
          <nav className="main-nav">
            <a href="#" className="nav-link">여성</a>
            <a href="#" className="nav-link">남성</a>
            <a href="#" className="nav-link">키즈</a>
            <Link to="/" className="nav-link">홈</Link>
          </nav>

          <div className="header-right">
            <div className="search-container">
              <span className="search-icon">Q</span>
              <input type="text" placeholder="검색" className="search-input" />
            </div>
            <div className="user-section">
              {user ? (
                <div className="user-dropdown">
                  <button
                    className={`user-dropdown-toggle ${showDropdown ? 'active' : ''}`}
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    {user.name}님 환영합니다 {user.user_type === 'admin' ? '• 어드민' : ''}
                    <span className="dropdown-arrow">▼</span>
                  </button>
                  {showDropdown && (
                    <div className="dropdown-menu">
                      <button
                        onClick={() => {
                          navigate('/orders')
                          setShowDropdown(false)
                        }}
                        className="dropdown-item"
                      >
                        📋 주문 내역
                      </button>
                      {user.user_type === 'admin' && (
                        <button
                          onClick={() => {
                            navigate('/admin')
                            setShowDropdown(false)
                          }}
                          className="dropdown-item"
                        >
                          🔧 어드민 관리
                        </button>
                      )}
                      <button
                        onClick={() => {
                          handleLogout()
                          setShowDropdown(false)
                        }}
                        className="dropdown-item"
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="login-btn" onClick={() => console.log('로그인 버튼 클릭됨')}>로그인</Link>
              )}
            </div>
            <div className="cart-icon" onClick={() => navigate('/cart')} style={{ cursor: 'pointer', position: 'relative' }}>
              🛍️
              {user && cartItemCount > 0 && (
                <span className="cart-badge">{cartItemCount}</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <img 
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
            alt="고급스러운 쇼핑몰 내부" 
            className="hero-image"
          />
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-content">
          <h1 className="hero-title">신상품 컬렉션</h1>
          <p className="hero-subtitle">현대적인 우아함이 담긴 최신 프리미엄 패션 아이템을 만나보세요</p>
          <button className="shop-now-btn">지금 쇼핑하기</button>
        </div>
      </section>

      {/* Collections Section */}
      <section className="collections-section">
        <div className="container">
          <h2 className="section-title">컬렉션</h2>
          <p className="section-subtitle">현대적인 옷장을 위해 엄선된 컬렉션을 발견해보세요</p>
          
          <div className="collections-grid">
            <div className="collection-card women">
              <div className="collection-overlay">
                <h3>여성</h3>
                <p>폴로의 클래식하고 세련된 스타일</p>
                <button className="collection-btn">컬렉션 보기</button>
              </div>
            </div>
            <div className="collection-card men">
              <div className="collection-overlay">
                <h3>남성</h3>
                <p>세련된 남성을 위한 세련된 의류</p>
                <button className="collection-btn">컬렉션 보기</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Products Section */}
      <section className="products-section">
        <div className="container">
          <h2 className="section-title">추천 상품</h2>
          
          {productsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              제품을 불러오는 중...
            </div>
          ) : (
            <div className="products-grid">
              {products.length > 0 ? (
                products.map((product, index) => (
                  <div key={product._id || index} className="product-card" onClick={() => window.location.href = `/product/${product._id}`} style={{ cursor: 'pointer' }}>
                    <div className="product-image">
                      {product.image ? (
                        <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          이미지 없음
                        </div>
                      )}
                    </div>
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-price">₩{product.price.toLocaleString()}</p>
                    <p className="product-id">#{product.sku}</p>
                    {product.tags && product.tags.includes('new') && (
                      <span className="product-tag new">신상품</span>
                    )}
                    {product.tags && product.tags.includes('sale') && (
                      <span className="product-tag sale">세일</span>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                  등록된 제품이 없습니다.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <div className="container">
          <h2 className="newsletter-title">STAY UPDATED</h2>
          <p className="newsletter-subtitle">Be the first to know about new collections and exclusive offers</p>
          
          <div className="newsletter-form">
            <input type="email" placeholder="Enter your email" className="email-input" />
            <button className="subscribe-btn">Subscribe</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-column">
              <h4>COMPANY</h4>
              <ul>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Press</a></li>
                <li><a href="#">Sustainability</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4>CUSTOMER CARE</h4>
              <ul>
                <li><a href="#">Size Guide</a></li>
                <li><a href="#">Shipping & Returns</a></li>
                <li><a href="#">Contact Us</a></li>
                <li><a href="#">FAQ</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4>LEGAL</h4>
              <ul>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Cookie Policy</a></li>
                <li><a href="#">Accessibility</a></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <div className="footer-brand">
              <span className="footer-logo">Arang</span>
              <p>© 2024 ZARA Style. All rights reserved.</p>
            </div>
            <div className="social-icons">
              <a href="#">📘</a>
              <a href="#">📷</a>
              <a href="#">🐦</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home


