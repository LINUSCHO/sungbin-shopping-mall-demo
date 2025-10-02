const mongoose = require('mongoose');

const { Schema } = mongoose;

const cartSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: [{
      product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1,
      },
      size: {
        type: String,
        trim: true,
        default: 'M',
      },
      color: {
        type: String,
        trim: true,
        default: 'Black',
      },
      price: {
        type: Number,
        required: true,
        min: 0,
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    totalItems: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// 사용자별로 하나의 활성 장바구니만 유지
cartSchema.index({ user: 1, isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

// 장바구니 총합 계산 미들웨어
cartSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
    this.totalPrice = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  } else {
    this.totalItems = 0;
    this.totalPrice = 0;
  }
  next();
});

// 장바구니에 상품 추가 메서드
cartSchema.methods.addItem = function(productId, quantity = 1, size = 'M', color = 'Black', price) {
  // 이미 같은 상품, 사이즈, 색상이 있는지 확인
  const existingItemIndex = this.items.findIndex(item => 
    item.product.toString() === productId.toString() && 
    item.size === size && 
    item.color === color
  );

  if (existingItemIndex > -1) {
    // 기존 아이템이 있으면 수량 증가
    this.items[existingItemIndex].quantity += quantity;
  } else {
    // 새로운 아이템 추가
    this.items.push({
      product: productId,
      quantity,
      size,
      color,
      price,
      addedAt: new Date(),
    });
  }
  
  return this.save();
};

// 장바구니에서 상품 제거 메서드
cartSchema.methods.removeItem = function(productId, size = 'M', color = 'Black') {
  this.items = this.items.filter(item => 
    !(item.product.toString() === productId.toString() && 
      item.size === size && 
      item.color === color)
  );
  
  return this.save();
};

// 장바구니 아이템 수량 업데이트 메서드
cartSchema.methods.updateItemQuantity = function(productId, quantity, size = 'M', color = 'Black') {
  const item = this.items.find(item => 
    item.product.toString() === productId.toString() && 
    item.size === size && 
    item.color === color
  );

  if (item) {
    if (quantity <= 0) {
      return this.removeItem(productId, size, color);
    } else {
      item.quantity = quantity;
      return this.save();
    }
  }
  
  return Promise.resolve(this);
};

// 장바구니 비우기 메서드
cartSchema.methods.clearCart = function() {
  this.items = [];
  return this.save();
};

// 사용자의 활성 장바구니 찾기 또는 생성
cartSchema.statics.findOrCreateActiveCart = function(userId) {
  return this.findOne({ user: userId, isActive: true })
    .populate('items.product')
    .then(cart => {
      if (!cart) {
        return this.create({ user: userId, items: [] });
      }
      return cart;
    });
};

module.exports = mongoose.models.Cart || mongoose.model('Cart', cartSchema);
