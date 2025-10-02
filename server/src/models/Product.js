const mongoose = require('mongoose');

const { Schema } = mongoose;

const productSchema = new Schema(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: ['상의', '하의', '악세사리'],
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
    images: [{
      type: String,
      trim: true,
    }],
    description: {
      type: String,
      trim: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// SKU 자동 생성 미들웨어 (선택사항)
productSchema.pre('save', async function(next) {
  if (this.isNew && !this.sku) {
    // SKU가 제공되지 않은 경우 자동 생성
    const count = await this.constructor.countDocuments();
    const categoryPrefix = this.category === '상의' ? 'TOP' : 
                          this.category === '하의' ? 'BOT' : 'ACC';
    this.sku = `${categoryPrefix}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// 인덱스 설정
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
