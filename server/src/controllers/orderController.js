const Order = require('../models/Order');

function isAdmin(user) {
  return user && user.user_type === 'admin';
}

// 내부 유틸: PortOne(Iamport) 결제 검증 (환경변수 있으면 사용, 없으면 기본 검증)
async function verifyPaymentWithPortOne(impUid, expectedAmount) {
  const apiKey = process.env.IAMPORT_API_KEY;
  const apiSecret = process.env.IAMPORT_API_SECRET;
  if (!apiKey || !apiSecret || !impUid) {
    // 환경변수 미설정 시 네트워크 검증 생략
    return { verified: !!impUid && typeof expectedAmount === 'number' && expectedAmount > 0, reason: 'basic-check' };
  }
  try {
    // 1) 액세스 토큰 발급
    const tokenRes = await fetch('https://api.iamport.kr/users/getToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imp_key: apiKey, imp_secret: apiSecret }),
    });
    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson?.response?.access_token;
    if (!accessToken) return { verified: false, reason: 'token-failed' };

    // 2) 결제 내역 조회
    const payRes = await fetch(`https://api.iamport.kr/payments/${impUid}`, {
      headers: { Authorization: accessToken },
    });
    const payJson = await payRes.json();
    const payment = payJson?.response;
    if (!payment) return { verified: false, reason: 'payment-not-found' };

    const statusOk = payment.status === 'paid';
    const amountOk = Number(payment.amount) === Number(expectedAmount);
    return { verified: statusOk && amountOk, reason: statusOk ? (amountOk ? 'ok' : 'amount-mismatch') : 'not-paid', payload: payment };
  } catch (e) {
    return { verified: false, reason: 'exception', error: String(e?.message || e) };
  }
}

// Create
async function createOrder(req, res) {
  try {
    const {
      items,
      discount = 0,
      tax = 0,
      total = 0,
      payment,
      shipping,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'items는 1개 이상이어야 합니다.' });
    }

    // 기본 유효성 (서버 스키마와 일치하는 필수 배송 정보 확인)
    const missing = [];
    if (!shipping?.receiverName) missing.push('receiverName');
    if (!shipping?.receiverPhone) missing.push('receiverPhone');
    if (!shipping?.postalCode) missing.push('postalCode');
    if (!shipping?.address1) missing.push('address1');
    if (typeof shipping?.fee !== 'number') missing.push('shipping.fee');
    if (missing.length) {
      return res.status(400).json({ message: `필수 배송 정보 누락: ${missing.join(', ')}` });
    }

    // 중복 주문 방지: imp_uid(=transactionId) 또는 merchant_uid 기준
    const transactionId = payment?.transactionId;
    const merchantUid = payment?.gatewayPayload?.merchant_uid;
    if (transactionId) {
      const dup = await Order.findOne({ 'payment.transactionId': transactionId });
      if (dup) {
        return res.status(409).json({ message: '이미 처리된 결제입니다.', orderId: dup._id });
      }
    }
    if (merchantUid) {
      const dupByMerchant = await Order.findOne({ 'payment.gatewayPayload.merchant_uid': merchantUid });
      if (dupByMerchant) {
        return res.status(409).json({ message: '이미 처리된 주문입니다.(merchant_uid)', orderId: dupByMerchant._id });
      }
    }

    // 결제 검증 시도 (가능하면 PortOne API로 검증)
    let verified = false;
    let verifyDetail = {};
    if (transactionId) {
      const result = await verifyPaymentWithPortOne(transactionId, total);
      verified = !!result.verified;
      verifyDetail = result;
    } else {
      // transactionId가 없다면 최소한의 방어: 금액/상태 형태 확인
      verified = payment?.status === 'paid' && typeof total === 'number' && total >= 0;
      verifyDetail = { verified, reason: 'no-transaction-id' };
    }
    if (!verified) {
      return res.status(400).json({ message: '결제 검증 실패', verifyDetail });
    }

    let doc = await Order.create({
      user: req.user._id,
      items,
      discount,
      tax,
      total,
      status: 'paid',
      payment,
      shipping,
    });

    // 프론트 표시용으로 상품 정보 포함
    doc = await doc.populate('items.product');
    return res.status(201).json(doc);
  } catch (error) {
    return res.status(400).json({ message: '주문 생성 실패', error: error.message });
  }
}

// Read - list (admin: all, user: own)
async function getOrders(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const query = isAdmin(req.user) ? {} : { user: req.user._id };
    
    // 상태별 필터링 추가
    if (status) {
      query.status = status;
    }

    const [items, total] = await Promise.all([
      Order.find(query).populate('items.product').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(query),
    ]);

    return res.status(200).json({ items, page, limit, total });
  } catch (error) {
    return res.status(500).json({ message: '주문 목록 조회 실패', error: error.message });
  }
}

// Read - detail
async function getOrderById(req, res) {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');
    if (!order) return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    if (!isAdmin(req.user) && String(order.user) !== String(req.user._id)) {
      return res.status(403).json({ message: '접근 권한이 없습니다.' });
    }
    return res.status(200).json(order);
  } catch (error) {
    return res.status(400).json({ message: '주문 조회 실패', error: error.message });
  }
}

// Update - status/payment/shipping/amounts
async function updateOrder(req, res) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });

    const isOwner = String(order.user) === String(req.user._id);

    const {
      status,
      payment,
      shipping,
      discount,
      tax,
      total,
    } = req.body;

    // 상태 변경 권한: admin만, 단 사용자는 canceled 로 변경 가능
    if (status !== undefined) {
      if (status === 'canceled') {
        if (!isOwner && !isAdmin(req.user)) {
          return res.status(403).json({ message: '취소 권한이 없습니다.' });
        }
        order.status = 'canceled';
        order.canceledAt = new Date();
      } else {
        if (!isAdmin(req.user)) {
          return res.status(403).json({ message: '상태 변경 권한이 없습니다.' });
        }
        order.status = status;
      }
    }

    if (payment !== undefined) {
      if (!isAdmin(req.user)) {
        return res.status(403).json({ message: '결제 정보 변경 권한이 없습니다.' });
      }
      order.payment = payment;
    }

    if (shipping !== undefined) {
      if (!isAdmin(req.user)) {
        return res.status(403).json({ message: '배송 정보 변경 권한이 없습니다.' });
      }
      order.shipping = shipping;
    }

    if (discount !== undefined) order.discount = discount;
    if (tax !== undefined) order.tax = tax;
    if (total !== undefined) order.total = total;

    await order.save();
    return res.status(200).json(order);
  } catch (error) {
    return res.status(400).json({ message: '주문 수정 실패', error: error.message });
  }
}

// Cancel (owner or admin)
async function cancelOrder(req, res) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    const isOwner = String(order.user) === String(req.user._id);
    if (!isOwner && !isAdmin(req.user)) {
      return res.status(403).json({ message: '취소 권한이 없습니다.' });
    }
    order.status = 'canceled';
    order.canceledAt = new Date();
    await order.save();
    return res.status(200).json(order);
  } catch (error) {
    return res.status(400).json({ message: '주문 취소 실패', error: error.message });
  }
}

// Delete (hard delete - admin only)
async function deleteOrder(req, res) {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: '삭제 권한이 없습니다.' });
    }
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    return res.status(204).send();
  } catch (error) {
    return res.status(400).json({ message: '주문 삭제 실패', error: error.message });
  }
}

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  cancelOrder,
  deleteOrder,
};


