import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiPost, apiGet } from '../../lib/api'
import './ProductForm.css'

function ProductForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = Boolean(id)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    sku: '',
    category: '상의',
    tags: '',
    size: '',
    color: '',
    isActive: true
  })
  const [images, setImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Cloudinary 위젯 초기화
  useEffect(() => {
    // Cloudinary 위젯 스크립트 로드
    if (!window.cloudinary) {
      const script = document.createElement('script')
      script.src = 'https://widget.cloudinary.com/v2.0/global/all.js'
      script.async = true
      document.head.appendChild(script)
    }
  }, [])

  // 수정 모드일 때 기존 상품 데이터 로드
  useEffect(() => {
    if (isEditMode && id) {
      const fetchProduct = async () => {
        try {
          const response = await apiGet(`/products/${id}`)
          if (response.success && response.data) {
            const product = response.data
            setFormData({
              name: product.name || '',
              description: product.description || '',
              price: product.price || 0,
              stock: product.stock || 0,
              sku: product.sku || '',
              category: product.category || '상의',
              tags: product.tags?.join(', ') || '',
              size: product.size || '',
              color: product.color || '',
              isActive: product.isActive !== undefined ? product.isActive : true
            })
            if (product.images && product.images.length > 0) {
              setImages(product.images)
              setImagePreviews(product.images)
            } else if (product.image) {
              // 기존 단일 이미지가 있는 경우 배열로 변환
              setImages([product.image])
              setImagePreviews([product.image])
            }
          }
        } catch (error) {
          console.error('상품 데이터 로드 실패:', error)
          alert('상품 데이터를 불러오는데 실패했습니다.')
          navigate('/admin')
        }
      }
      fetchProduct()
    }
  }, [isEditMode, id, navigate])

  // Cloudinary 위젯 열기
  const openCloudinaryWidget = () => {
    if (window.cloudinary) {
      // 환경변수에서 설정값 가져오기
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo'
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'unsigned'
      
      console.log('Cloudinary 설정:', { cloudName, uploadPreset })
      
      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName: cloudName,
          uploadPreset: uploadPreset,
          sources: ['local', 'url', 'camera'],
          multiple: false,
          cropping: true,
          croppingAspectRatio: 1,
          showSkipCropButton: false,
          maxImageWidth: 1200,
          maxImageHeight: 1200,
          clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
          maxFileSize: 10000000, // 10MB
          styles: {
            palette: {
              window: '#FFFFFF',
              sourceBg: '#F4F4F5',
              windowBorder: '#90A0B3',
              tabIcon: '#0078FF',
              inactiveTabIcon: '#69778A',
              menuIcons: '#0078FF',
              link: '#0078FF',
              action: '#0078FF',
              inProgress: '#0078FF',
              complete: '#20B832',
              error: '#EA2727',
              textDark: '#000000',
              textLight: '#FFFFFF'
            },
            fonts: {
              default: null,
              "'Poppins', sans-serif": {
                url: 'https://fonts.googleapis.com/css?family=Poppins',
                active: true
              }
            }
          }
        },
        (error, result) => {
          if (!error && result) {
            if (result.event === 'success') {
              console.log('업로드 성공:', result.info)
              const uploadedUrl = result.info.secure_url
              
              if (images.length < 3) {
                setImages(prev => [...prev, uploadedUrl])
                setImagePreviews(prev => [...prev, uploadedUrl])
                alert('이미지가 성공적으로 업로드되었습니다!')
              } else {
                alert('최대 3개의 이미지만 업로드할 수 있습니다.')
              }
            } else if (result.event === 'display-changed') {
              console.log('위젯 상태 변경:', result)
            } else if (result.event === 'show-completed') {
              console.log('업로드 완료 표시')
            }
          } else if (error) {
            console.error('Cloudinary 업로드 오류:', error)
            alert('이미지 업로드 중 오류가 발생했습니다. 다시 시도해주세요.')
          }
        }
      )
      
      widget.open()
    } else {
      alert('Cloudinary 위젯을 로드하는 중입니다. 잠시 후 다시 시도해주세요.')
      
      // 위젯이 로드되지 않은 경우 재시도
      setTimeout(() => {
        if (window.cloudinary) {
          openCloudinaryWidget()
        }
      }, 2000)
    }
  }

  const generateSKU = () => {
    const categoryPrefix = formData.category === '상의' ? 'TOP' : 
                          formData.category === '하의' ? 'BOT' : 'ACC'
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    const newSKU = `${categoryPrefix}-${timestamp}-${random}`
    setFormData(prev => ({ ...prev, sku: newSKU }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 이미지 처리 - 최소 1개 이상의 이미지가 필요
      const finalImages = images.length > 0 ? images : ['https://via.placeholder.com/400x400?text=No+Image']

      const productData = {
        sku: formData.sku,
        name: formData.name,
        price: parseInt(formData.price),
        category: formData.category,
        images: finalImages,
        image: finalImages[0], // 첫 번째 이미지를 메인 이미지로 사용
        description: formData.description || '',
        stock: parseInt(formData.stock),
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        isActive: formData.isActive
      }

      console.log(isEditMode ? '상품 수정 데이터:' : '상품 등록 데이터:', productData)
      
      // 실제 API 호출
      let response
      if (isEditMode) {
        response = await fetch(`/api/products/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth') || sessionStorage.getItem('auth') || '{}').tokens?.accessToken}`
          },
          body: JSON.stringify(productData)
        })
        response = await response.json()
      } else {
        response = await apiPost('/products', productData)
      }
      
      if (response.success) {
        alert(`상품이 성공적으로 ${isEditMode ? '수정' : '등록'}되었습니다!`)
        navigate('/admin')
      } else {
        throw new Error(response.message || `상품 ${isEditMode ? '수정' : '등록'}에 실패했습니다.`)
      }
      
    } catch (error) {
      console.error('상품 등록 오류:', error)
      
      // 에러 메시지 처리
      let errorMessage = '상품 등록에 실패했습니다.'
      
      if (error.message.includes('409')) {
        errorMessage = '이미 존재하는 SKU입니다. 다른 SKU를 사용해주세요.'
      } else if (error.message.includes('401')) {
        errorMessage = '로그인이 필요합니다.'
      } else if (error.message.includes('403')) {
        errorMessage = '관리자 권한이 필요합니다.'
      } else if (error.message.includes('400')) {
        errorMessage = '입력 정보를 확인해주세요.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/admin')
  }

  return (
    <div className="product-form-container">
      <div className="product-form-header">
        <h1 className="form-title">{isEditMode ? '상품 수정' : '새 상품 등록'}</h1>
        <button className="close-btn" onClick={handleCancel}>×</button>
      </div>

      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-grid">
          {/* 왼쪽 열 */}
          <div className="form-column">
            {/* 기본 정보 */}
            <div className="form-section">
              <h3 className="section-title">기본 정보</h3>
              
              <div className="form-group">
                <label className="form-label">상품명</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">상품 설명</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-textarea"
                  rows="4"
                />
              </div>
            </div>

            {/* 가격 및 재고 */}
            <div className="form-section">
              <h3 className="section-title">가격 및 재고</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">가격</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="form-input"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">재고 수량</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    className="form-input"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">SKU (상품 코드)</label>
                <div className="sku-input-group">
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateSKU}
                    className="auto-generate-btn"
                    disabled={isEditMode}
                  >
                    자동 생성
                  </button>
                </div>
              </div>
            </div>

            {/* 속성 */}
            <div className="form-section">
              <h3 className="section-title">속성</h3>
              
              <div className="form-group">
                <label className="form-label">사이즈 (쉼표로 구분)</label>
                <input
                  type="text"
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="예: S, M, L, XL"
                />
              </div>

              <div className="form-group">
                <label className="form-label">색상 (쉼표로 구분)</label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="예: 빨강, 파랑, 검정"
                />
              </div>
            </div>
          </div>

          {/* 오른쪽 열 */}
          <div className="form-column">
            {/* 카테고리 및 태그 */}
            <div className="form-section">
              <h3 className="section-title">카테고리 및 태그</h3>
              
              <div className="form-group">
                <label className="form-label">카테고리</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="상의">상의</option>
                  <option value="하의">하의</option>
                  <option value="악세사리">악세사리</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">태그 (쉼표로 구분)</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="예: 신상품, 세일, 인기"
                />
              </div>
            </div>

            {/* 이미지 */}
            <div className="form-section">
              <h3 className="section-title">이미지 (최대 3개)</h3>
              
              <div className="images-upload-area">
                {/* 업로드된 이미지들 표시 */}
                <div className="images-grid">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="image-preview-item">
                      <img src={preview} alt={`상품 이미지 ${index + 1}`} />
                      <div className="image-actions">
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={() => {
                            const newImages = images.filter((_, i) => i !== index)
                            const newPreviews = imagePreviews.filter((_, i) => i !== index)
                            setImages(newImages)
                            setImagePreviews(newPreviews)
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* 빈 슬롯들 */}
                  {Array.from({ length: 3 - imagePreviews.length }).map((_, index) => (
                    <div key={`empty-${index}`} className="upload-placeholder" onClick={openCloudinaryWidget}>
                      <div className="upload-icon">☁️</div>
                      <p>이미지 추가</p>
                    </div>
                  ))}
                </div>
                
                {images.length > 0 && (
                  <div className="image-info">
                    <small>업로드된 이미지: {images.length}/3</small>
                  </div>
                )}
              </div>
              
              {/* 환경변수 디버깅 정보 (개발용) */}
              {import.meta.env.DEV && (
                <div className="debug-info">
                  <small>디버깅 정보:</small>
                  <div className="debug-values">
                    <span>Cloud Name: {import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo (기본값)'}</span>
                    <span>Upload Preset: {import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'unsigned (기본값)'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* 상태 */}
            <div className="form-section">
              <h3 className="section-title">상태</h3>
              
              <div className="form-group">
                <div className="toggle-group">
                  <label className="form-label">상품 활성화</label>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      id="isActive"
                    />
                    <label htmlFor="isActive" className="toggle-label"></label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-secondary"
          >
            취소
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? '저장 중...' : (isEditMode ? '수정 저장' : '상품 저장')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProductForm
