const Cart = require('../models/Cart');
const Product = require('../models/Product');

// 사용자의 장바구니 조회
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const cart = await Cart.findOrCreateActiveCart(userId);
    
    res.json({
      success: true,
      data: cart,
    });
  } catch (error) {
    console.error('장바구니 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 조회에 실패했습니다.',
    });
  }
};

// 장바구니에 상품 추가
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1, size = 'M', color = 'Black' } = req.body;

    // 상품 존재 여부 확인
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.',
      });
    }

    if (!product.isActive) {
      return res.status(400).json({
        success: false,
        message: '비활성화된 상품입니다.',
      });
    }

    // 재고 확인
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: '재고가 부족합니다.',
      });
    }

    // 장바구니 조회 또는 생성
    let cart = await Cart.findOne({ user: userId, isActive: true });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // 장바구니에 상품 추가
    await cart.addItem(productId, quantity, size, color, product.price);

    res.json({
      success: true,
      message: '장바구니에 상품이 추가되었습니다.',
      data: cart,
    });
  } catch (error) {
    console.error('장바구니 추가 오류:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 추가에 실패했습니다.',
    });
  }
};

// 장바구니에서 상품 제거
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, size = 'M', color = 'Black' } = req.body;

    const cart = await Cart.findOne({ user: userId, isActive: true });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다.',
      });
    }

    await cart.removeItem(productId, size, color);

    res.json({
      success: true,
      message: '장바구니에서 상품이 제거되었습니다.',
      data: cart,
    });
  } catch (error) {
    console.error('장바구니 제거 오류:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 제거에 실패했습니다.',
    });
  }
};

// 장바구니 아이템 수량 업데이트
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity, size = 'M', color = 'Black' } = req.body;

    const cart = await Cart.findOne({ user: userId, isActive: true });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다.',
      });
    }

    await cart.updateItemQuantity(productId, quantity, size, color);

    res.json({
      success: true,
      message: '장바구니가 업데이트되었습니다.',
      data: cart,
    });
  } catch (error) {
    console.error('장바구니 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 업데이트에 실패했습니다.',
    });
  }
};

// 장바구니 비우기
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId, isActive: true });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다.',
      });
    }

    await cart.clearCart();

    res.json({
      success: true,
      message: '장바구니가 비워졌습니다.',
      data: cart,
    });
  } catch (error) {
    console.error('장바구니 비우기 오류:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 비우기에 실패했습니다.',
    });
  }
};

// 특정 장바구니 아이템 조회
const getCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: userId, isActive: true })
      .populate('items.product');
    
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

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('장바구니 아이템 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 아이템 조회에 실패했습니다.',
    });
  }
};

// 특정 아이템 수량만 업데이트
const updateCartItemQuantity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: userId, isActive: true });
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

    if (quantity <= 0) {
      item.remove();
    } else {
      item.quantity = quantity;
    }

    await cart.save();

    res.json({
      success: true,
      message: '수량이 업데이트되었습니다.',
      data: cart,
    });
  } catch (error) {
    console.error('수량 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: '수량 업데이트에 실패했습니다.',
    });
  }
};

// 특정 장바구니 아이템 제거
const removeCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: userId, isActive: true });
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

    cart.items.pull(itemId);
    await cart.save();

    res.json({
      success: true,
      message: '장바구니 아이템이 제거되었습니다.',
      data: cart,
    });
  } catch (error) {
    console.error('장바구니 아이템 제거 오류:', error);
    res.status(500).json({
      success: false,
      message: '장바구니 아이템 제거에 실패했습니다.',
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
  updateCartItem,
  clearCart,
  getCartItem,
  updateCartItemQuantity,
  removeCartItem,
};
