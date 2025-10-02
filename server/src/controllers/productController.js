const Product = require('../models/Product');

// 상품 등록
const createProduct = async (req, res) => {
  try {
    const { sku, name, price, category, image, description, stock, tags } = req.body;

    // 필수 필드 검증
    if (!sku || !name || !price || !category || !image) {
      return res.status(400).json({
        success: false,
        message: '필수 필드가 누락되었습니다. (sku, name, price, category, image)'
      });
    }

    // 가격 검증
    if (price < 0) {
      return res.status(400).json({
        success: false,
        message: '가격은 0 이상이어야 합니다.'
      });
    }

    // 카테고리 검증
    const validCategories = ['상의', '하의', '악세사리'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 카테고리입니다. (상의, 하의, 악세사리 중 선택)'
      });
    }

    // SKU 중복 검사
    const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });
    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: '이미 존재하는 SKU입니다.'
      });
    }

    // 상품 생성
    const product = new Product({
      sku: sku.toUpperCase(),
      name,
      price,
      category,
      image,
      description: description || '',
      stock: stock || 0,
      tags: tags || [],
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: '상품이 성공적으로 등록되었습니다.',
      data: product
    });

  } catch (error) {
    console.error('상품 등록 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
};

// 상품 목록 조회
const getProducts = async (req, res) => {
  try {
    const { category, page = 1, limit = 10, search } = req.query;
    
    // 쿼리 조건 설정
    const query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;
    
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('상품 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
};

// 상품 상세 조회
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('상품 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
};

// SKU로 상품 조회
const getProductBySku = async (req, res) => {
  try {
    const { sku } = req.params;

    const product = await Product.findOne({ sku: sku.toUpperCase() });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('상품 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
};

// 상품 수정
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // SKU가 변경되는 경우 중복 검사
    if (updateData.sku) {
      const existingProduct = await Product.findOne({ 
        sku: updateData.sku.toUpperCase(),
        _id: { $ne: id }
      });
      
      if (existingProduct) {
        return res.status(409).json({
          success: false,
          message: '이미 존재하는 SKU입니다.'
        });
      }
      
      updateData.sku = updateData.sku.toUpperCase();
    }

    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      message: '상품이 성공적으로 수정되었습니다.',
      data: product
    });

  } catch (error) {
    console.error('상품 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
};

// 상품 삭제 (소프트 삭제)
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      message: '상품이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('상품 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
};

// 모든 상품 조회 (어드민용 - 비활성 상품 포함)
const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    const products = await Product.find({})
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments({});

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('모든 상품 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
};

// 카테고리별 상품 조회
const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const validCategories = ['상의', '하의', '악세사리'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 카테고리입니다.'
      });
    }

    const skip = (page - 1) * limit;
    
    const products = await Product.find({ 
      category, 
      isActive: true 
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments({ 
      category, 
      isActive: true 
    });

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('카테고리별 상품 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
};

// 상품 검색
const searchProducts = async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: '검색어가 필요합니다.'
      });
    }

    const skip = (page - 1) * limit;
    
    // 검색 조건 구성
    const searchConditions = {
      isActive: true,
      $text: { $search: q }
    };
    
    if (category) {
      searchConditions.category = category;
    }
    
    if (minPrice || maxPrice) {
      searchConditions.price = {};
      if (minPrice) searchConditions.price.$gte = parseInt(minPrice);
      if (maxPrice) searchConditions.price.$lte = parseInt(maxPrice);
    }

    const products = await Product.find(searchConditions)
      .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(searchConditions);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('상품 검색 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
};

// 상품 재고 수정
const updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, operation } = req.body; // operation: 'set', 'add', 'subtract'

    if (typeof stock !== 'number' || stock < 0) {
      return res.status(400).json({
        success: false,
        message: '재고는 0 이상의 숫자여야 합니다.'
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.'
      });
    }

    let newStock = product.stock;
    
    switch (operation) {
      case 'add':
        newStock += stock;
        break;
      case 'subtract':
        newStock -= stock;
        if (newStock < 0) {
          return res.status(400).json({
            success: false,
            message: '재고가 부족합니다.'
          });
        }
        break;
      case 'set':
      default:
        newStock = stock;
        break;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { stock: newStock },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: '재고가 성공적으로 수정되었습니다.',
      data: {
        productId: updatedProduct._id,
        sku: updatedProduct.sku,
        name: updatedProduct.name,
        previousStock: product.stock,
        newStock: updatedProduct.stock,
        operation: operation || 'set'
      }
    });

  } catch (error) {
    console.error('재고 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
};

module.exports = {
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
};
