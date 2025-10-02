import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiGet, apiPost } from '../lib/api'
import './ProductDetail.css'

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState('S')
  const [selectedColor, setSelectedColor] = useState('Black')
  const [selectedImage, setSelectedImage] = useState(0)
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const response = await apiGet(`/products/${id}`)
      if (response.success) {
        setProduct(response.data)
      }
    } catch (error) {
      console.error('상품 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToProducts = () => {
    navigate('/')
  }

  const handleAddToBag = async () => {
    if (!product) return
    
    try {
      setAddingToCart(true)
      
      const response = await apiPost('/cart', {
        productId: product._id,
        quantity: 1,
        size: selectedSize,
        color: selectedColor
      })
      
      if (response.success) {
        alert('장바구니에 추가되었습니다!')
        // 장바구니 카운트 업데이트를 위해 Home 페이지로 이동
        navigate('/')
      } else {
        alert(response.message || '장바구니 추가에 실패했습니다.')
      }
    } catch (error) {
      console.error('장바구니 추가 실패:', error)
      if (error.message === '로그인이 필요합니다.') {
        alert('로그인이 필요합니다. 로그인 페이지로 이동합니다.')
        navigate('/login')
      } else {
        alert('장바구니 추가에 실패했습니다.')
      }
    } finally {
      setAddingToCart(false)
    }
  }

  const handleWishlist = () => {
    // 위시리스트 추가 로직
    alert('위시리스트에 추가되었습니다!')
  }

  const handleShare = () => {
    // 공유 로직
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: product?.description,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('링크가 클립보드에 복사되었습니다!')
    }
  }

  if (loading) {
    return (
      <div className="product-detail-loading">
        <div className="loading-spinner">로딩 중...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="product-detail-error">
        <h2>상품을 찾을 수 없습니다</h2>
        <button onClick={handleBackToProducts} className="back-button">
          상품 목록으로 돌아가기
        </button>
      </div>
    )
  }

  // 실제 상품 이미지들 사용
  const productImages = product.images && product.images.length > 0 
    ? product.images 
    : product.image 
      ? [product.image] 
      : ['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop&q=60']

  return (
    <div className="product-detail-page">
      {/* Top Navigation */}
      <div className="product-detail-header">
        <button onClick={handleBackToProducts} className="back-button">
          ← Back to products
        </button>
        <button className="fullscreen-button">⛶</button>
      </div>

      <div className="product-detail-content">
        {/* Left Side - Product Images */}
        <div className="product-images-section">
          <div className="main-image">
            <img 
              src={productImages[selectedImage]} 
              alt={product.name}
              className="main-product-image"
            />
          </div>
          <div className="thumbnail-images">
            {productImages.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${product.name} ${index + 1}`}
                className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                onClick={() => setSelectedImage(index)}
              />
            ))}
          </div>
        </div>

        {/* Right Side - Product Info */}
        <div className="product-info-section">
          <div className="product-tag">NEW</div>
          <h1 className="product-title">{product.name}</h1>
          <div className="product-price">₩{product.price.toLocaleString()}</div>
          
          <p className="product-description">
            A perfectly tailored blazer crafted from premium wool blend. Features structured shoulders, notched lapels, and a single-button closure. The epitome of modern sophistication.
          </p>

          {/* Size Selection */}
          <div className="size-selection">
            <label className="selection-label">Size</label>
            <div className="size-options">
              {['XS', 'S', 'M', 'L', 'XL'].map(size => (
                <button
                  key={size}
                  className={`size-option ${selectedSize === size ? 'selected' : ''}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="color-selection">
            <label className="selection-label">Color</label>
            <div className="color-options">
              {['Black', 'Navy', 'Camel'].map(color => (
                <button
                  key={color}
                  className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                  onClick={() => setSelectedColor(color)}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Add to Bag Button */}
          <button 
            className="add-to-bag-button" 
            onClick={handleAddToBag}
            disabled={addingToCart}
          >
            {addingToCart ? 'ADDING...' : 'ADD TO BAG'}
          </button>

          {/* Action Icons */}
          <div className="action-icons">
            <button className="action-icon" onClick={handleWishlist} title="위시리스트에 추가">
              ♥
            </button>
            <button className="action-icon" onClick={handleShare} title="공유">
              ↗
            </button>
          </div>

          {/* Product Details */}
          <div className="product-details">
            <h3 className="details-title">Details</h3>
            <ul className="details-list">
              <li>100% wool blend</li>
              <li>Dry clean only</li>
              <li>Structured shoulders</li>
              <li>Single-button closure</li>
              <li>Two front pockets</li>
              <li>Fully lined</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
