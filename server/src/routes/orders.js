const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  cancelOrder,
  deleteOrder,
} = require('../controllers/orderController');

// 모든 라우트 인증 필수 (주문 리소스는 소유자/관리자만 접근)
router.use(authenticate);

// 목록/상세
router.get('/', getOrders);
router.get('/:id', getOrderById);

// 생성
router.post('/', createOrder);

// 수정 (상태/금액/결제/배송)
router.put('/:id', updateOrder);

// 취소 전용 엔드포인트
router.post('/:id/cancel', cancelOrder);

// 삭제 (관리자만, 컨트롤러에서 권한 체크)
router.delete('/:id', deleteOrder);

module.exports = router;


