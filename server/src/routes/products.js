const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  getProductBySku,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getProductsByCategory,
  searchProducts,
  updateProductStock
} = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');

// 어드민 권한 확인 미들웨어
const requireAdmin = (req, res, next) => {
  if (req.user.user_type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '관리자 권한이 필요합니다.'
    });
  }
  next();
};

// ==================== READ (조회) 라우트 ====================

// 상품 목록 조회 (공개) - 활성 상품만
router.get('/', getProducts);

// 모든 상품 조회 (어드민만) - 비활성 상품 포함
router.get('/all', authenticate, requireAdmin, getAllProducts);

// 카테고리별 상품 조회 (공개)
router.get('/category/:category', getProductsByCategory);

// 상품 검색 (공개)
router.get('/search', searchProducts);

// SKU로 상품 조회 (공개)
router.get('/sku/:sku', getProductBySku);

// 상품 상세 조회 (공개)
router.get('/:id', getProductById);

// ==================== CREATE (생성) 라우트 ====================

// 상품 등록 (어드민만)
router.post('/', authenticate, requireAdmin, createProduct);

// ==================== UPDATE (수정) 라우트 ====================

// 상품 정보 수정 (어드민만)
router.put('/:id', authenticate, requireAdmin, updateProduct);

// 상품 재고 수정 (어드민만)
router.patch('/:id/stock', authenticate, requireAdmin, updateProductStock);

// ==================== DELETE (삭제) 라우트 ====================

// 상품 삭제 (소프트 삭제) (어드민만)
router.delete('/:id', authenticate, requireAdmin, deleteProduct);

// 상품 완전 삭제 (하드 삭제) (어드민만)
router.delete('/:id/force', authenticate, requireAdmin, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      message: '상품이 완전히 삭제되었습니다.'
    });
  } catch (error) {
    console.error('상품 완전 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
