import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet, apiPost } from '../lib/api'
import './Checkout.css'

function Checkout() {
  const navigate = useNavigate()
  const [cart, setCart] = useState(null)
  const [shipping, setShipping] = useState({
    receiverName: '',
    receiverPhone: '',
    postalCode: '',
    address1: '',
    address2: '',
    message: ''
  })
  const [email, setEmail] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)

  // PortOne(IMP) 초기화
  useEffect(() => {
    if (typeof window !== 'undefined' && window.IMP && typeof window.IMP.init === 'function') {
      try {
        window.IMP.init('imp10717311')
      } catch (e) {
        console.error('IMP.init 실패:', e)
      }
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const res = await apiGet('/cart')
        if (res.success) setCart(res.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const subtotal = cart ? cart.items.reduce((sum, it) => sum + (it.price * it.quantity), 0) : 0
  const shippingFee = 0
  const tax = Math.round(subtotal * 0.1)
  const total = subtotal + tax + shippingFee

  const placeOrder = async () => {
    try {
      setPlacing(true)
      // 필수 입력값 검증 (서버 모델의 required 필드와 일치)
      const requiredMissing = []
      if (!shipping.receiverName?.trim()) requiredMissing.push('수령인')
      if (!shipping.receiverPhone?.trim()) requiredMissing.push('연락처')
      if (!email?.trim()) requiredMissing.push('이메일')
      if (!shipping.postalCode?.trim()) requiredMissing.push('우편번호')
      if (!shipping.address1?.trim()) requiredMissing.push('주소')
      if (subtotal <= 0) requiredMissing.push('주문 상품')
      if (requiredMissing.length > 0) {
        alert(`다음 정보를 입력해 주세요: ${requiredMissing.join(', ')}`)
        return
      }
      const items = cart.items.map(it => ({
        product: it.product._id,
        quantity: it.quantity,
        size: it.size,
        color: it.color,
      }))

      // PortOne 결제 요청 (성공 시 주문 생성)
      if (!window.IMP || typeof window.IMP.request_pay !== 'function') {
        alert('결제 모듈이 로드되지 않았습니다. 잠시 후 다시 시도해 주세요.')
        return
      }

      const merchantUid = 'mid_' + Date.now()
      const payMethodMap = {
        card: 'card',
        transfer: 'trans',
        virtual_account: 'vbank',
        kakaopay: 'kakaopay',
        naverpay: 'naverpay',
      }

      const payParams = {
        pg: 'html5_inicis',
        pay_method: payMethodMap[paymentMethod] || 'card',
        merchant_uid: merchantUid,
        name: `주문 (${cart.items.length}개 상품)`,
        amount: total,
        buyer_email: email,
        buyer_name: shipping.receiverName,
        buyer_tel: shipping.receiverPhone,
        buyer_addr: `${shipping.address1} ${shipping.address2}`.trim(),
        buyer_postcode: shipping.postalCode,
      }

      const payResult = await new Promise((resolve) => {
        window.IMP.request_pay(payParams, (rsp) => {
          if (rsp && rsp.success) {
            resolve({ ok: true, rsp })
          } else {
            resolve({ ok: false, rsp })
          }
        })
      })

      if (!payResult.ok) {
        const message = (payResult.rsp && payResult.rsp.error_msg) ? payResult.rsp.error_msg : '결제가 취소되었거나 실패했습니다.'
        alert(message)
        return
      }

      const { rsp } = payResult

      const paymentPayload = {
        method: paymentMethod,
        status: 'paid',
        currency: 'KRW',
        amount: total,
        transactionId: rsp.imp_uid,
        paidAt: rsp.paid_at ? new Date(rsp.paid_at * 1000).toISOString() : new Date().toISOString(),
        gatewayPayload: {
          pg_provider: rsp.pg_provider,
          merchant_uid: rsp.merchant_uid,
          receipt_url: rsp.receipt_url,
          success: rsp.success,
          error_code: rsp.error_code,
          error_msg: rsp.error_msg,
        },
      }

      const res = await apiPost('/orders', {
        items,
        discount: 0,
        tax,
        total,
        payment: paymentPayload,
        shipping: { ...shipping, fee: shippingFee }
      })

      if (res && res._id) {
        navigate(`/orders/success/${res._id}`, { state: { order: res } })
        return
      }

      if (res && res.success === false) {
        navigate('/orders/fail', { state: { message: res.message || '주문 생성 실패' } })
      }
    } catch (e) {
      console.error(e)
      navigate('/orders/fail', { state: { message: '결제 또는 주문 생성에 실패했습니다.' } })
    } finally {
      setPlacing(false)
    }
  }

  if (loading || !cart) {
    return <div className="checkout-page">로딩 중...</div>
  }

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <button className="back-button" onClick={() => navigate(-1)}>← 뒤로</button>
        <h1>주문하기</h1>
        <div className="steps">
          <span className="step active">1 배송정보</span>
          <span className="step">2 결제</span>
          <span className="step">3 확인</span>
        </div>
      </div>

      <div className="checkout-content">
        <div className="shipping-form">
          <h2>배송 정보</h2>
          <div className="form-grid">
            <div className="field">
              <label>수령인</label>
              <input value={shipping.receiverName} onChange={e => setShipping({ ...shipping, receiverName: e.target.value })} placeholder="John Doe" />
            </div>
            <div className="field">
              <label>연락처</label>
              <input value={shipping.receiverPhone} onChange={e => setShipping({ ...shipping, receiverPhone: e.target.value })} placeholder="010-1234-5678" />
            </div>
            <div className="field full">
              <label>이메일</label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" />
            </div>
            <div className="field">
              <label>우편번호</label>
              <input value={shipping.postalCode} onChange={e => setShipping({ ...shipping, postalCode: e.target.value })} placeholder="12345" />
            </div>
            <div className="field">
              <label>도시</label>
              <input placeholder="서울" />
            </div>
            <div className="field full">
              <label>주소</label>
              <input value={shipping.address1} onChange={e => setShipping({ ...shipping, address1: e.target.value })} placeholder="도로명 주소" />
            </div>
            <div className="field full">
              <label>상세 주소</label>
              <input value={shipping.address2} onChange={e => setShipping({ ...shipping, address2: e.target.value })} placeholder="상세 주소" />
            </div>
            <div className="field full">
              <label>배송 메모</label>
              <input value={shipping.message} onChange={e => setShipping({ ...shipping, message: e.target.value })} placeholder="배송 메모 (선택)" />
            </div>
          </div>

          <h2 style={{ marginTop: 16 }}>결제 정보</h2>
          <div className="payment-options">
            <label className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
              <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
              신용/체크카드
            </label>
            <label className={`payment-option ${paymentMethod === 'transfer' ? 'selected' : ''}`}>
              <input type="radio" name="payment" value="transfer" checked={paymentMethod === 'transfer'} onChange={() => setPaymentMethod('transfer')} />
              계좌이체
            </label>
            <label className={`payment-option ${paymentMethod === 'virtual_account' ? 'selected' : ''}`}>
              <input type="radio" name="payment" value="virtual_account" checked={paymentMethod === 'virtual_account'} onChange={() => setPaymentMethod('virtual_account')} />
              가상계좌
            </label>
            <label className={`payment-option ${paymentMethod === 'kakaopay' ? 'selected' : ''}`}>
              <input type="radio" name="payment" value="kakaopay" checked={paymentMethod === 'kakaopay'} onChange={() => setPaymentMethod('kakaopay')} />
              카카오페이
            </label>
            <label className={`payment-option ${paymentMethod === 'naverpay' ? 'selected' : ''}`}>
              <input type="radio" name="payment" value="naverpay" checked={paymentMethod === 'naverpay'} onChange={() => setPaymentMethod('naverpay')} />
              네이버페이
            </label>
          </div>
        </div>

        <div className="order-summary">
          <h2>주문 요약</h2>
          <div className="summary-items">
            {cart.items.map((it) => (
              <div className="summary-item" key={it._id}>
                <img src={it.product.image} alt={it.product.name} />
                <div className="meta">
                  <div className="name">{it.product.name}</div>
                  <div className="options">{it.size} - {it.color}</div>
                </div>
                <div className="price">₩{(it.price * it.quantity).toLocaleString()}</div>
              </div>
            ))}
          </div>
          <div className="summary-rows">
            <div className="row"><span>소계 ({cart.items.length}개)</span><span>₩{subtotal.toLocaleString()}</span></div>
            <div className="row"><span>배송비</span><span>{shippingFee === 0 ? '무료' : `₩${shippingFee.toLocaleString()}`}</span></div>
            <div className="row"><span>세금</span><span>₩{tax.toLocaleString()}</span></div>
          </div>
          <div className="total-row">
            <span>총액</span>
            <span className="total">₩{total.toLocaleString()}</span>
          </div>
          <button className="place-order" onClick={placeOrder} disabled={placing}>
            주문하기
          </button>
          <div className="secure-note">안전한 SSL 암호화 결제</div>
        </div>
      </div>
    </div>
  )
}

export default Checkout


