const mongoose = require('mongoose');

const { Schema } = mongoose;

const orderItemSchema = new Schema(
  {
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
  },
  { _id: false }
);

const paymentSchema = new Schema(
  {
    method: {
      type: String,
      enum: ['card', 'transfer', 'virtual_account', 'naverpay', 'kakaopay', 'paypal', 'applepay', 'googlepay', 'free'],
      required: true,
      default: 'card',
    },
    status: {
      type: String,
      enum: ['pending', 'authorized', 'paid', 'failed', 'refunded', 'partial_refunded', 'canceled'],
      required: true,
      default: 'pending',
    },
    currency: {
      type: String,
      required: true,
      default: 'KRW',
      uppercase: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    transactionId: {
      type: String,
      trim: true,
      index: true,
    },
    gatewayPayload: {
      type: Schema.Types.Mixed,
      select: false,
    },
    paidAt: {
      type: Date,
    },
  },
  { _id: false }
);

const shippingSchema = new Schema(
  {
    receiverName: {
      type: String,
      required: true,
      trim: true,
    },
    receiverPhone: {
      type: String,
      required: true,
      trim: true,
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
    },
    address1: {
      type: String,
      required: true,
      trim: true,
    },
    address2: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
    provider: {
      type: String,
      trim: true,
    },
    trackingNumber: {
      type: String,
      trim: true,
      index: true,
    },
    fee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    shippedAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      validate: v => Array.isArray(v) && v.length > 0,
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      index: true,
    },
    // 상태
    status: {
      type: String,
      enum: ['created', 'pending_payment', 'paid', 'preparing', 'shipped', 'delivered', 'completed', 'canceled', 'refunded'],
      required: true,
      default: 'created',
      index: true,
    },
    payment: paymentSchema,
    shipping: shippingSchema,
    // 환불/취소
    canceledAt: {
      type: Date,
    },
    // 메모 및 메타데이터
    // 주문번호 (사내 식별자)
    orderNumber: {
      type: String,
      unique: true,
      index: true,
      sparse: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// 합계 계산은 서비스/컨트롤러에서 설정

// 인덱스
orderSchema.index({ createdAt: -1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

// 주문번호 자동 생성 (YYYYMMDD-XXXX)
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const prefix = `${y}${m}${d}`;
    const count = await this.constructor.countDocuments({ createdAt: { $gte: new Date(`${y}-${m}-${d}T00:00:00.000Z`) } });
    this.orderNumber = `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);


