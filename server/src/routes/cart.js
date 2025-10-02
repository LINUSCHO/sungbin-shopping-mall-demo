const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Cart = require('../models/Cart');
const {
  getCart,
  addToCart,
  removeFromCart,
  updateCartItem,
  clearCart,
  getCartItem,
  updateCartItemQuantity,
  removeCartItem,
} = require('../controllers/cartController');

// 모든 장바구니 라우트는 인증이 필요
router.use(authenticate);

// ===== READ Operations =====
// GET /api/cart - 사용자의 장바구니 조회
router.get('/', getCart);

// GET /api/cart/item/:itemId - 특정 장바구니 아이템 조회
router.get('/item/:itemId', getCartItem);

// ===== CREATE Operations =====
// POST /api/cart - 장바구니에 상품 추가
router.post('/', addToCart);

// POST /api/cart/bulk - 여러 상품을 한번에 장바구니에 추가
router.post('/bulk', async (req, res) => {
  try {
    const { items } = req.body;
    const results = [];
    
    for (const item of items) {
      const { productId, quantity, size, color } = item;
      // 각 아이템을 개별적으로 추가
      const result = await addToCart({ 
        ...req, 
        body: { productId, quantity, size, color } 
      }, res);
      results.push(result);
    }
    
    res.json({
      success: true,
      message: '모든 상품이 장바구니에 추가되었습니다.',
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '일괄 추가에 실패했습니다.',
    });
  }
});

// ===== UPDATE Operations =====
// PUT /api/cart - 장바구니 아이템 수량 업데이트 (기존)
router.put('/', updateCartItem);

// PUT /api/cart/item/:itemId/quantity - 특정 아이템 수량만 업데이트
router.put('/item/:itemId/quantity', updateCartItemQuantity);

// PUT /api/cart/item/:itemId - 특정 아이템 전체 정보 업데이트
router.put('/item/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity, size, color } = req.body;
    
    // 특정 아이템 업데이트 로직
    const cart = await Cart.findOne({ user: req.user.id, isActive: true });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다.',
      });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: '장바구니 아이템을 찾을 수 없습니다.',
      });
    }

    if (quantity !== undefined) item.quantity = quantity;
    if (size !== undefined) item.size = size;
    if (color !== undefined) item.color = color;

    await cart.save();

    res.json({
      success: true,
      message: '장바구니 아이템이 업데이트되었습니다.',
      data: cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '아이템 업데이트에 실패했습니다.',
    });
  }
});

// ===== DELETE Operations =====
// DELETE /api/cart - 장바구니에서 상품 제거 (기존)
router.delete('/', removeFromCart);

// DELETE /api/cart/item/:itemId - 특정 장바구니 아이템 제거
router.delete('/item/:itemId', removeCartItem);

// DELETE /api/cart/clear - 장바구니 비우기
router.delete('/clear', clearCart);

// DELETE /api/cart/items/bulk - 여러 아이템 일괄 제거
router.delete('/items/bulk', async (req, res) => {
  try {
    const { itemIds } = req.body;
    const cart = await Cart.findOne({ user: req.user.id, isActive: true });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다.',
      });
    }

    // 여러 아이템 제거
    cart.items = cart.items.filter(item => !itemIds.includes(item._id.toString()));
    await cart.save();

    res.json({
      success: true,
      message: '선택된 아이템들이 제거되었습니다.',
      data: cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '일괄 제거에 실패했습니다.',
    });
  }
});

// ===== UTILITY Operations =====
// GET /api/cart/count - 장바구니 아이템 개수 조회
router.get('/count', async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id, isActive: true });
    const count = cart ? cart.totalItems : 0;
    
    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '장바구니 개수 조회에 실패했습니다.',
    });
  }
});

// GET /api/cart/total - 장바구니 총 가격 조회
router.get('/total', async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id, isActive: true });
    const total = cart ? cart.totalPrice : 0;
    
    res.json({
      success: true,
      data: { total },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '총 가격 조회에 실패했습니다.',
    });
  }
});

// POST /api/cart/validate - 장바구니 유효성 검사
router.post('/validate', async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id, isActive: true })
      .populate('items.product');
    
    if (!cart) {
      return res.json({
        success: true,
        data: { isValid: true, issues: [] },
      });
    }

    const issues = [];
    
    // 재고 확인
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        issues.push({
          type: 'stock',
          message: `${item.product.name}의 재고가 부족합니다.`,
          itemId: item._id,
        });
      }
      
      if (!item.product.isActive) {
        issues.push({
          type: 'inactive',
          message: `${item.product.name}이 비활성화되었습니다.`,
          itemId: item._id,
        });
      }
    }

    res.json({
      success: true,
      data: {
        isValid: issues.length === 0,
        issues,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '장바구니 유효성 검사에 실패했습니다.',
    });
  }
});

module.exports = router;
