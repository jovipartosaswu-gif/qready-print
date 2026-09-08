import { useState, useEffect } from 'react'
import './App.css'
import { MatrixBackground } from './components/MatrixBackground'
import { 
  sendOrderConfirmation, 
  sendOrderStatusUpdate,
  isEmailConfigured 
} from './emailService'
import {
  processXenditPayment,
  isXenditConfigured
} from './xenditService'
import {
  isSupabaseConfigured,
  getAllOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  deleteAllOrders,
  getAllAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  subscribeToOrders
} from './supabaseService'

const PAPER_SIZES = ['A4', 'A3', 'Letter', 'Legal']
const COLOR_MODES = ['Black & White', 'Full Color']
const SIDES = ['Single-sided', 'Double-sided']
const BINDINGS = ['None', 'Staple', 'Spiral Binding', 'Comb Binding']

const PRICING = {
  paperSize: { A4: 0, A3: 5, Letter: 0, Legal: 2 },
  colorMode: { 'Black & White': 3, 'Full Color': 12 },
  sides: { 'Single-sided': 0, 'Double-sided': -1 },
  binding: { None: 0, Staple: 5, 'Spiral Binding': 25, 'Comb Binding': 20 },
}

const STATUS_FLOW = ['Pending', 'Accepted', 'Printing', 'Ready', 'Completed']

const NEXT_STATUS = {
  Pending: 'Accepted',
  Accepted: 'Printing',
  Printing: 'Ready',
  Ready: 'Completed',
}

const STATUS_COLORS = {
  Pending: 'status-pending',
  Accepted: 'status-accepted',
  Printing: 'status-printing',
  Ready: 'status-ready',
  Completed: 'status-completed',
}

function computePriceDetails(opts, pages) {
  const colorRate = PRICING.colorMode[opts.colorMode]
  const sizeRate = PRICING.paperSize[opts.paperSize]
  const sideDiscount = PRICING.sides[opts.sides]
  
  const basePerPage = Math.max(0.5, colorRate + sizeRate + sideDiscount)
  const effectivePages = opts.sides === 'Double-sided' ? Math.ceil(pages / 2) : pages
  const printSubtotal = basePerPage * effectivePages * opts.copies
  const bindingFee = PRICING.binding[opts.binding]
  const total = (printSubtotal + bindingFee).toFixed(2)

  return {
    basePerPage: basePerPage.toFixed(2),
    effectivePages,
    printSubtotal: printSubtotal.toFixed(2),
    bindingFee,
    total,
  }
}

function generateOrderId() {
  return 'QR-' + Math.random().toString(36).slice(2, 7).toUpperCase()
}

function formatRelativeTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffSecs = Math.floor((now - date) / 1000)
  
  if (diffSecs < 60) return 'Just now'
  if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`
  if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// ── Home Landing Page ─────────────────────────────────────────────────────────
function HomeDashboard({ onPlaceOrder, onTrackOrder, onStaffClick, onAdminSecretClick }) {
  return (
    <div className="page animate-fade-in home-page-with-clouds">
      {/* Matrix Background */}
      <div className="cloud-shader-background">
        <MatrixBackground color="#2255C9" fontSize={14} speed={0.8} />
      </div>

      {/* Content Overlay */}
      <div className="home-content-overlay">
        <header className="site-header">
          <div className="logo">
            <img src="/logo.png" alt="QReady Logo" className="logo-image" />
          </div>
          <nav>
            <button className="nav-link" onClick={onPlaceOrder}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Place Order
            </button>
            <button className="nav-link" onClick={onTrackOrder}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              Track Order
            </button>
            <button className="nav-link" onClick={onStaffClick}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Login
            </button>
          </nav>
        </header>

        <main className="home-main">
          <section className="hero-section">
            <h1>Welcome to QReady</h1>
            <p>The fastest and most reliable way to queue your print jobs on campus. Upload your documents from anywhere and pick them up when they're ready.</p>
            <button className="btn-primary btn-lg" onClick={onPlaceOrder}>
              Start Print Order
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </section>

          <section className="services-section">
            <div className="services-grid">
              <div className="service-card">
                <div className="service-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </div>
                <h3>Any Format</h3>
                <p>We support PDF, DOC, and DOCX files. Automatic page counting and real-time price estimation.</p>
              </div>
              <div className="service-card">
                <div className="service-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                </div>
                <h3>Full Color & Sizes</h3>
                <p>Choose from Black & White or Full Color. We stock A4, A3, Letter, and Legal paper sizes.</p>
              </div>
              <div className="service-card">
                <div className="service-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                </div>
                <h3>Professional Binding</h3>
                <p>Finish your documents cleanly with Staple, Spiral, or Comb binding options available instantly.</p>
              </div>
            </div>
          </section>
        </main>

        <footer className="home-footer">
          <div>
            <span
              className="footer-secret"
              onClick={onAdminSecretClick}
              title=""
            >
              &copy; {new Date().getFullYear()} QReady Print Services. All rights reserved.
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}

// ── Student Order Form ────────────────────────────────────────────────────────
function OrderForm({ onSubmit, onHomeClick, onStaffClick }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    paperSize: 'A4',
    colorMode: 'Black & White',
    sides: 'Single-sided',
    copies: 1,
    binding: 'None',
    file: null,
    fileName: '',
    fileSize: '',
    pages: 1,
  })
  const [errors, setErrors] = useState({})
  const [isDragging, setIsDragging] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const processFile = f => {
    if (!f) return

    // Simple validation - just check file exists and is reasonable size
    const MAX_SIZE = 50 * 1024 * 1024 // 50MB
    
    if (f.size > MAX_SIZE) {
      setErrors(prev => ({ ...prev, file: 'File is too large. Maximum size is 50MB' }))
      return
    }

    if (f.size < 1024) {
      setErrors(prev => ({ ...prev, file: 'File is too small. It may be corrupted or empty' }))
      return
    }

    // Estimate pages
    let estimatedPages = Math.max(1, Math.round(f.size / 51200))
    
    // File is valid, process it
    const sizeStr = (f.size / (1024 * 1024)).toFixed(2) + ' MB'
    setForm(prev => ({
      ...prev,
      file: f,
      fileName: f.name,
      fileSize: sizeStr,
      pages: estimatedPages,
    }))
    setErrors(prev => ({ ...prev, file: undefined }))
  }

  const handleFileChange = e => {
    const f = e.target.files[0]
    processFile(f)
  }

  const handleDragOver = e => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = e => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = e => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Full name is required.'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email is required.'
    if (!form.fileName) e.file = 'Please upload a document.'
    if (form.copies < 1 || form.copies > 100) e.copies = 'Copies must be between 1 and 100.'
    return e
  }

  const handleSubmit = e => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setShowPaymentModal(true)
  }

  const handlePaymentSelect = (paymentMethod) => {
    setShowPaymentModal(false)
    onSubmit({ ...form, paymentMethod })
  }

  const priceDetails = computePriceDetails(form, form.pages)

  return (
    <div className="page animate-fade-in home-page-with-clouds">
      {/* Matrix Background */}
      <div className="cloud-shader-background">
        <MatrixBackground color="#2255C9" fontSize={14} speed={0.8} />
      </div>

      {/* Content Overlay */}
      <div className="home-content-overlay">
      <header className="site-header">
        <div className="logo" onClick={onHomeClick}>
          <img src="/logo.png" alt="QReady Logo" className="logo-image" />
        </div>
        <nav>
          <button className="nav-link" onClick={onHomeClick}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Home
          </button>
          <button className="nav-link" onClick={onStaffClick}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Login
          </button>
        </nav>
      </header>

      <main className="form-main">
        <div className="form-card">
          <div className="form-card-header">
            <h1>Place a Print Order</h1>
            <p>Upload your document, select your preferences, and queue your job directly for instant processing at the print shop.</p>
            
            <div className="step-indicator">
              <div className={`step-item ${form.name && form.email ? 'active' : ''}`}>
                <span className="step-num">1</span>
                <span>Contact Info</span>
              </div>
              <div className={`step-item ${form.fileName ? 'active' : ''}`}>
                <span className="step-num">2</span>
                <span>Upload</span>
              </div>
              <div className={`step-item ${form.fileName ? 'active' : ''}`}>
                <span className="step-num">3</span>
                <span>Print Specs</span>
              </div>
              <div className={`step-item ${form.name && form.email && form.fileName ? 'active' : ''}`}>
                <span className="step-num">4</span>
                <span>Checkout</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <section className="form-section">
              <div className="form-section-title">Contact Details</div>
              <div className="field-row">
                <div className="field">
                  <label>Full Name</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Juan dela Cruz" />
                  {errors.name && <span className="error">{errors.name}</span>}
                </div>
                <div className="field">
                  <label>Email Address</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="juan@university.edu" />
                  {errors.email && <span className="error">{errors.email}</span>}
                </div>
              </div>
            </section>

            <section className="form-section">
              <div className="form-section-title">Document Upload</div>
              <div className="field">
                <div 
                  className={`file-drop ${isDragging ? 'is-dragging' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input 
                    type="file" 
                    id="file-input" 
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png" 
                    onChange={handleFileChange} 
                  />
                  <label htmlFor="file-input" className="file-label">
                    {form.fileName ? (
                      <div className="file-selected-box">
                        <div className="file-details">
                          <div className="file-icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          </div>
                          <div>
                            <div className="file-name">
                              {form.fileName}
                              <span style={{ 
                                fontSize: '10px', 
                                fontWeight: '700', 
                                color: '#2255C9', 
                                backgroundColor: 'rgba(34, 85, 201, 0.15)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                marginLeft: '8px',
                                textTransform: 'uppercase'
                              }}>
                                {form.fileName.split('.').pop()}
                              </span>
                            </div>
                            <div className="file-size">{form.fileSize} &middot; ~{form.pages} pages</div>
                          </div>
                        </div>
                        <span className="file-change-btn">Change</span>
                      </div>
                    ) : (
                      <>
                        <div className="file-icon">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--slate)' }}>Drag & drop file here or click to browse</span>
                        <span className="file-hint">PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, PNG • Max 50MB</span>
                      </>
                    )}
                  </label>
                </div>
                {errors.file && <span className="error">{errors.file}</span>}
              </div>
            </section>

            <section className="form-section">
              <div className="form-section-title">Print Specifications</div>
              <div className="field-row">
                <div className="field">
                  <label>Paper Size</label>
                  <select value={form.paperSize} onChange={e => set('paperSize', e.target.value)}>
                    {PAPER_SIZES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Color Mode</label>
                  <select value={form.colorMode} onChange={e => set('colorMode', e.target.value)}>
                    {COLOR_MODES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Print Sides</label>
                  <select value={form.sides} onChange={e => set('sides', e.target.value)}>
                    {SIDES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Binding Option</label>
                  <select value={form.binding} onChange={e => set('binding', e.target.value)}>
                    {BINDINGS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="field-row">
                <div className="field field-sm">
                  <label>Number of Copies</label>
                  <input
                    type="number" min="1" max="100"
                    value={form.copies}
                    onChange={e => set('copies', Math.max(1, parseInt(e.target.value) || 1))}
                  />
                  {errors.copies && <span className="error">{errors.copies}</span>}
                </div>
                <div className="field field-sm">
                  <label>
                    Total Page Count
                    <span className="label-sub">(auto)</span>
                  </label>
                  <input 
                    type="number" 
                    value={form.pages} 
                    min="1" 
                    onChange={e => set('pages', Math.max(1, parseInt(e.target.value) || 1))} 
                  />
                </div>
              </div>
            </section>

            <div className="price-card">
              <div className="price-card-title">Live Cost Estimate</div>
              <div className="price-lines">
                <div className="price-line">
                  <span className="line-label">Print Subtotal ({form.colorMode}, {form.paperSize}, {form.sides})</span>
                  <span>PHP {priceDetails.printSubtotal}</span>
                </div>
                <div className="price-line">
                  <span className="line-label">Page Count × Copies</span>
                  <span>{priceDetails.effectivePages} pgs × {form.copies} {form.copies === 1 ? 'copy' : 'copies'}</span>
                </div>
                {form.binding !== 'None' && (
                  <div className="price-line">
                    <span className="line-label">Binding ({form.binding})</span>
                    <span>+ PHP {priceDetails.bindingFee}.00</span>
                  </div>
                )}
              </div>
              <div className="price-total-row">
                <div className="price-total-label">Estimated Total</div>
                <div className="price-total-amount">PHP {priceDetails.total}</div>
              </div>
            </div>

            <button type="submit" className="btn-primary btn-full">
              Pay
            </button>
          </form>
        </div>

        {/* Payment Method Modal */}
        {showPaymentModal && (
          <PaymentMethodModal
            onClose={() => setShowPaymentModal(false)}
            onSelectPayment={handlePaymentSelect}
          />
        )}
      </main>
      </div>
    </div>
  )
}

// ── Order Confirmation View ──────────────────────────────────────────────────
function Confirmation({ order, queuePos, onNewOrder, onHomeClick }) {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState(null)
  const [showPaymentButton, setShowPaymentButton] = useState(false)

  // Check if this is an online payment that needs to be processed
  useEffect(() => {
    const isOnlinePayment = order.paymentMethod && 
                           (order.paymentMethod.includes('GCash') || 
                            order.paymentMethod.includes('Maya') ||
                            order.paymentMethod.includes('PayMaya'))
    setShowPaymentButton(isOnlinePayment)
  }, [order.paymentMethod])

  const handleProceedToPayment = async () => {
    setIsProcessingPayment(true)
    setPaymentError(null)

    try {
      // Extract payment method name
      let paymentMethodName = order.paymentMethod
      if (order.paymentMethod.includes('(Online)')) {
        paymentMethodName = order.paymentMethod.replace(' (Online)', '').trim()
      }

      // Process the payment with Xendit
      const paymentCharge = await processXenditPayment(order, paymentMethodName)

      if (paymentCharge.isMock) {
        // Mock payment for testing (no API keys configured)
        alert('⚠️ Xendit not configured yet.\n\nTo enable real payments:\n1. Add your Xendit API keys to .env file\n2. Restart the dev server\n\nSee XENDIT_SETUP_GUIDE.md for details.')
        setIsProcessingPayment(false)
        return
      }

      // Redirect to payment checkout
      if (paymentCharge.checkout_url) {
        window.location.href = paymentCharge.checkout_url
      } else {
        throw new Error('No checkout URL received')
      }

    } catch (error) {
      console.error('Payment Error:', error)
      setPaymentError(error.message || 'Failed to process payment. Please try again.')
      setIsProcessingPayment(false)
    }
  }

  return (
    <div className="page animate-fade-in">
      <header className="site-header">
        <div className="logo" onClick={onHomeClick}>
          <img src="/logo.png" alt="QReady Logo" className="logo-image" />
          <span>QReady</span>
        </div>
      </header>
      <main className="confirm-main">
        <div className="confirm-card">
          <div className="confirm-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            Order Received
          </div>
          <h1>{order.id}</h1>
          <p className="confirm-sub">Your document is queued for printing. {!showPaymentButton ? `A confirmation email has been sent to ${order.email}.` : 'Complete your payment to receive a confirmation email.'}</p>

          <div className="confirm-queue">
            <span className="queue-label">Queue Position</span>
            <span className="queue-number">#{queuePos}</span>
          </div>

          <div className="confirm-details">
            <div className="detail-row"><span>Customer Name</span><span>{order.name}</span></div>
            <div className="detail-row"><span>Email</span><span>{order.email}</span></div>
            <div className="detail-row"><span>File Name</span><span>{order.fileName}</span></div>
            <div className="detail-row"><span>Print Options</span><span>{order.colorMode} &middot; {order.paperSize} &middot; {order.sides}</span></div>
            <div className="detail-row"><span>Quantity & Binding</span><span>{order.copies} {order.copies === 1 ? 'copy' : 'copies'} ({order.binding})</span></div>
            <div className="detail-row"><span>Payment Method</span><span>{order.paymentMethod}</span></div>
            <div className="detail-row total-row"><span>Total Amount</span><span>PHP {order.price}</span></div>
          </div>

          {showPaymentButton ? (
            <>
              <div className="payment-notice">
                <div className="payment-notice-icon">💳</div>
                <div className="payment-notice-content">
                  <h3>Complete Your Payment</h3>
                  <p>Click the button below to proceed to {order.paymentMethod.replace(' (Online)', '')} checkout and complete your payment securely.</p>
                </div>
              </div>

              {paymentError && (
                <div className="error-notice">
                  <strong>Payment Error:</strong> {paymentError}
                </div>
              )}

              <button 
                className="btn-primary btn-payment"
                onClick={handleProceedToPayment}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    Proceed to Payment
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </>
                )}
              </button>

              <p className="payment-secure-note">
                🔒 Secure payment powered by Xendit
              </p>
            </>
          ) : (
            <>
              <p className="confirm-note">
                A confirmation email has been sent to <strong>{order.email}</strong>. 
                You'll receive updates when your order is accepted, ready, and completed. 
                Show your Order ID <strong>{order.id}</strong> at the printing counter for collection.
                <br/><br/>
                💡 Tip: You can track your order status anytime using the <strong>Track Order</strong> page with your Order ID and email.
              </p>

              <button className="btn-primary" onClick={onNewOrder}>
                Submit Another Document
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

// ── Payment Method Modal ──────────────────────────────────────────────────────
function PaymentMethodModal({ onClose, onSelectPayment }) {
  const [showEwalletOptions, setShowEwalletOptions] = useState(false)

  const ewallets = [
    { name: 'GCash', icon: '💙', code: 'GCash' },
    { name: 'Maya', icon: '💚', code: 'Maya' },
  ]

  const handlePaymentChoice = (method) => {
    if (method === 'online') {
      setShowEwalletOptions(true)
    } else {
      onSelectPayment('Cash')
    }
  }

  const handleEwalletSelect = (ewallet) => {
    onSelectPayment(`${ewallet.name} (Online)`)
  }

  return (
    <div className="modal-overlay">
      <div className="payment-modal">
        <h2>Select Payment Method</h2>
        <p>Choose how you would like to pay for your order</p>

        {!showEwalletOptions ? (
          <div className="payment-options">
            <button 
              className="payment-option-card"
              onClick={() => handlePaymentChoice('cash')}
            >
              <div className="payment-icon">💵</div>
              <h3>Pay at Counter</h3>
              <p>Bring exact amount when picking up</p>
              <div style={{ 
                marginTop: '12px', 
                padding: '8px 12px', 
                background: 'var(--success-bg)', 
                border: '1px solid var(--success-border)',
                borderRadius: '6px',
                fontSize: '13px',
                color: 'var(--success)',
                fontWeight: '600'
              }}>
                ✓ Recommended • No fees
              </div>
            </button>

            <button 
              className="payment-option-card"
              onClick={() => handlePaymentChoice('online')}
            >
              <div className="payment-icon">💳</div>
              <h3>Pay Online</h3>
              <p>GCash, Maya (PayMaya)</p>
              <div style={{ 
                marginTop: '12px', 
                padding: '8px 12px', 
                background: 'var(--info-bg)', 
                border: '1px solid var(--primary-border)',
                borderRadius: '6px',
                fontSize: '13px',
                color: 'var(--primary)',
                fontWeight: '600'
              }}>
                ⚡ Instant Payment
              </div>
            </button>
          </div>
        ) : (
          <div className="ewallet-options">
            <button 
              className="back-btn"
              onClick={() => setShowEwalletOptions(false)}
            >
              ← Back
            </button>
            <div className="ewallet-grid">
              {ewallets.map(ewallet => (
                <button
                  key={ewallet.name}
                  className="ewallet-card"
                  onClick={() => handleEwalletSelect(ewallet)}
                >
                  <span className="ewallet-icon">{ewallet.icon}</span>
                  <span className="ewallet-name">{ewallet.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <button className="btn-secondary btn-full" onClick={onClose} style={{ marginTop: '16px' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Staff Dashboard ───────────────────────────────────────────────────────────
function StaffDashboard({ orders, user, onAdvance, onHomeClick, isPolling }) {
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  const activeOrders = orders.filter(o => o.status !== 'Completed')

  const counts = STATUS_FLOW.reduce((acc, s) => {
    acc[s] = activeOrders.filter(o => o.status === s).length
    return acc
  }, {})

  const filteredOrders = activeOrders.filter(o => {
    const matchesFilter = filter === 'All' || o.status === filter
    const searchLower = search.toLowerCase()
    const matchesSearch = 
      !search || 
      o.id.toLowerCase().includes(searchLower) ||
      o.name.toLowerCase().includes(searchLower) ||
      o.email.toLowerCase().includes(searchLower) ||
      (o.fileName && o.fileName.toLowerCase().includes(searchLower))
    return matchesFilter && matchesSearch
  })

  return (
    <div className="page animate-fade-in">
      <header className="site-header">
        <div className="logo" onClick={onHomeClick}>
          <img src="/logo.png" alt="QReady Logo" className="logo-image" />
          <span className="staff-badge">{user?.company || 'Staff'}</span>
        </div>
        <button className="nav-link" onClick={onHomeClick}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Exit to Home
        </button>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div className="dashboard-title-area">
            <h1>
              Staff Print Queue
              {isPolling && (
                <span className="live-indicator">
                  <span className="live-dot"></span>
                  Live
                </span>
              )}
            </h1>
            <p>Logged in as {user?.username} ({user?.role})</p>
          </div>

          <div className="search-box">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input 
              type="text" 
              placeholder="Search active orders..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </div>

        <div className="stat-row">
          {['Pending', 'Accepted', 'Printing', 'Ready'].map(s => (
            <div 
              key={s} 
              className={`stat-card ${STATUS_COLORS[s]}`}
              onClick={() => setFilter(s)}
            >
              <span className="stat-count">{counts[s]}</span>
              <span className="stat-label">{s}</span>
            </div>
          ))}
        </div>

        <div className="filter-bar">
          {['All', 'Pending', 'Accepted', 'Printing', 'Ready'].map(s => (
            <button
              key={s}
              className={`filter-btn ${filter === s ? 'active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s} {s !== 'All' && <span className="filter-count">{counts[s]}</span>}
            </button>
          ))}
        </div>

        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block' }}><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>
            No active print orders matching your criteria.
          </div>
        ) : (
          <div className="order-table-wrap">
            <table className="order-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Document</th>
                  <th>Specs</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id}>
                    <td className="order-id">
                      {order.id}
                      <div className="order-time">{formatRelativeTime(order.createdAt)}</div>
                    </td>
                    <td>
                      <div className="customer-name">{order.name}</div>
                      <div className="customer-email">{order.email}</div>
                    </td>
                    <td className="doc-name">{order.fileName || 'Document.pdf'}</td>
                    <td>
                      <div className="specs">
                        {order.paperSize} &middot; {order.colorMode}<br />
                        {order.sides} &middot; {order.copies} {order.copies === 1 ? 'copy' : 'copies'}
                        {order.binding !== 'None' && <><br />Binding: {order.binding}</>}
                      </div>
                    </td>
                    <td className="order-price">PHP {order.price}</td>
                    <td>
                      <span className={`payment-badge ${order.paymentMethod?.includes('Online') ? 'payment-online' : 'payment-cash'}`}>
                        {order.paymentMethod?.includes('Online') ? '💳 ' : '💵 '}
                        {order.paymentMethod || 'Cash'}
                      </span>
                    </td>
                    <td><span className={`status-pill ${STATUS_COLORS[order.status]}`}>{order.status}</span></td>
                    <td>
                      <button
                        className="btn-advance"
                        onClick={() => onAdvance(order.id, NEXT_STATUS[order.status])}
                      >
                        Mark {NEXT_STATUS[order.status]} &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

// ── Super Admin Dashboard ─────────────────────────────────────────────────────
function SuperAdminDashboard({ orders, user, accounts, onAddAccount, onDeleteAccount, onChangePassword, onAdvance, onDelete, onClearAll, onHomeClick, onStaffClick, onPlaceOrder, isPolling }) {
  const [activeTab, setActiveTab] = useState('queue') // 'queue' | 'completed' | 'users' | 'analytics'
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(null)

  // New User Form State
  const [newUsername, setNewUsername] = useState('')
  const [newPin, setNewPin] = useState('')
  const [newCompany, setNewCompany] = useState('')

  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.price || 0), 0)

  // Filter Active vs Completed orders
  const activeOrders = orders.filter(o => o.status !== 'Completed')
  const completedOrders = orders.filter(o => o.status === 'Completed')

  const queueToDisplay = activeTab === 'queue' ? activeOrders : completedOrders

  const filteredOrders = queueToDisplay.filter(o => {
    const matchesFilter = filter === 'All' || o.status === filter
    const searchLower = search.toLowerCase()
    const matchesSearch = 
      !search || 
      o.id.toLowerCase().includes(searchLower) ||
      o.name.toLowerCase().includes(searchLower) ||
      o.email.toLowerCase().includes(searchLower)
    return matchesFilter && matchesSearch
  })

  const handleAddAccount = (e) => {
    e.preventDefault()
    if (!newUsername || !newPin || !newCompany) return alert('All fields required')
    if (accounts.find(a => a.username === newUsername)) return alert('Username already exists')
    
    onAddAccount({
      id: Date.now().toString(),
      username: newUsername,
      pin: newPin,
      company: newCompany,
      role: 'staff'
    })

    setNewUsername(''); setNewPin(''); setNewCompany('');
  }

  return (
    <div className="page animate-fade-in">
      <header className="site-header">
        <div className="logo" onClick={onHomeClick}>
          <img src="/logo.png" alt="QReady Logo" className="logo-image" />
          <span className="admin-badge">Super Admin</span>
        </div>
        <nav>
          <button className="nav-link" onClick={onHomeClick}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </nav>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div className="dashboard-title-area">
            <h1>
              Admin Control Center
              {isPolling && (
                <span className="live-indicator">
                  <span className="live-dot"></span>
                  Live
                </span>
              )}
            </h1>
            <p>Welcome, {user?.company || 'Admin'} ({user?.username})</p>
          </div>

          {activeTab !== 'users' && activeTab !== 'analytics' && (
            <div className="search-box">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input 
                type="text" 
                placeholder="Search orders..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
          )}
        </div>

        <div className="stat-row admin-stats">
          <div className="stat-card admin-revenue">
            <span className="stat-count">PHP {totalRevenue.toFixed(2)}</span>
            <span className="stat-label">Total System Revenue</span>
          </div>
          <div className="stat-card status-accepted">
            <span className="stat-count">{orders.length}</span>
            <span className="stat-label">Total Orders Processed</span>
          </div>
          <div className="stat-card status-completed">
            <span className="stat-count">{completedOrders.length}</span>
            <span className="stat-label">Completed Orders</span>
          </div>
        </div>

        <div className="admin-tabs">
          <button className={`admin-tab ${activeTab === 'queue' ? 'active' : ''}`} onClick={() => { setActiveTab('queue'); setFilter('All'); }}>Active Queue ({activeOrders.length})</button>
          <button className={`admin-tab ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => { setActiveTab('completed'); setFilter('All'); }}>Completed Orders ({completedOrders.length})</button>
          <button className={`admin-tab ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>Analytics</button>
          <button className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>User Accounts ({accounts.length})</button>
        </div>

        {activeTab === 'analytics' ? (
          <>
          {/* Analytics Dashboard */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            {/* Revenue Overview */}
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(34, 85, 201, 0.2) 0%, rgba(34, 85, 201, 0.05) 100%)',
              border: '1px solid rgba(34, 85, 201, 0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#2255C9', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                💰 Total Revenue
              </div>
              <div style={{ fontSize: '36px', fontWeight: '900', color: 'var(--text)', marginBottom: '4px' }}>
                PHP {totalRevenue.toFixed(2)}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                From {orders.length} total orders
              </div>
            </div>

            {/* Completed Revenue */}
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.2) 0%, rgba(22, 163, 74, 0.05) 100%)',
              border: '1px solid rgba(22, 163, 74, 0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#16a34a', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ✅ Completed Revenue
              </div>
              <div style={{ fontSize: '36px', fontWeight: '900', color: 'var(--text)', marginBottom: '4px' }}>
                PHP {completedOrders.reduce((sum, o) => sum + parseFloat(o.price || 0), 0).toFixed(2)}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                From {completedOrders.length} completed orders
              </div>
            </div>

            {/* Pending Revenue */}
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(245, 166, 35, 0.2) 0%, rgba(245, 166, 35, 0.05) 100%)',
              border: '1px solid rgba(245, 166, 35, 0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#F5A623', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ⏳ Pending Revenue
              </div>
              <div style={{ fontSize: '36px', fontWeight: '900', color: 'var(--text)', marginBottom: '4px' }}>
                PHP {activeOrders.reduce((sum, o) => sum + parseFloat(o.price || 0), 0).toFixed(2)}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                From {activeOrders.length} active orders
              </div>
            </div>
          </div>

          {/* Order Breakdown by Status */}
          <div style={{ 
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: 'var(--text)' }}>
              📊 Orders by Status
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {STATUS_FLOW.map(status => {
                const statusOrders = orders.filter(o => o.status === status)
                const statusRevenue = statusOrders.reduce((sum, o) => sum + parseFloat(o.price || 0), 0)
                return (
                  <div key={status} style={{
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '16px',
                    textAlign: 'center'
                  }}>
                    <div className={`status-pill ${STATUS_COLORS[status]}`} style={{ marginBottom: '12px' }}>
                      {status}
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text)', marginBottom: '4px' }}>
                      {statusOrders.length}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      orders
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--primary)' }}>
                      PHP {statusRevenue.toFixed(2)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div style={{ 
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: 'var(--text)' }}>
              💳 Payment Methods
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              {(() => {
                const cashOrders = orders.filter(o => o.paymentMethod === 'Cash')
                const onlineOrders = orders.filter(o => o.paymentMethod && o.paymentMethod !== 'Cash')
                const cashRevenue = cashOrders.reduce((sum, o) => sum + parseFloat(o.price || 0), 0)
                const onlineRevenue = onlineOrders.reduce((sum, o) => sum + parseFloat(o.price || 0), 0)
                
                return (
                  <>
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(245, 166, 35, 0.15) 0%, rgba(245, 166, 35, 0.05) 100%)',
                      border: '1px solid rgba(245, 166, 35, 0.3)',
                      borderRadius: 'var(--radius)',
                      padding: '20px',
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '12px' }}>
                        💵 Cash Payments
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text)', marginBottom: '8px' }}>
                        {cashOrders.length}
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#F5A623' }}>
                        PHP {cashRevenue.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {orders.length > 0 ? ((cashOrders.length / orders.length) * 100).toFixed(1) : 0}% of orders
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(34, 85, 201, 0.15) 0%, rgba(34, 85, 201, 0.05) 100%)',
                      border: '1px solid rgba(34, 85, 201, 0.3)',
                      borderRadius: 'var(--radius)',
                      padding: '20px',
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '12px' }}>
                        💳 Online Payments
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text)', marginBottom: '8px' }}>
                        {onlineOrders.length}
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#2255C9' }}>
                        PHP {onlineRevenue.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {orders.length > 0 ? ((onlineOrders.length / orders.length) * 100).toFixed(1) : 0}% of orders
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ 
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: 'var(--text)' }}>
              🕒 Recent Orders
            </h3>
            <div className="order-table-wrap">
              <table className="order-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Total</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 10).map(order => (
                    <tr key={order.id}>
                      <td><span className="order-id">{order.id}</span></td>
                      <td>
                        <div className="customer-name">{order.name}</div>
                        <div className="customer-email">{order.email}</div>
                      </td>
                      <td><span className={`status-pill ${STATUS_COLORS[order.status]}`}>{order.status}</span></td>
                      <td>
                        <span className={`payment-badge ${order.paymentMethod === 'Cash' ? 'payment-cash' : 'payment-online'}`}>
                          {order.paymentMethod || 'Cash'}
                        </span>
                      </td>
                      <td><span className="order-price">PHP {order.price}</span></td>
                      <td>
                        <div className="order-time">{formatRelativeTime(order.createdAt)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </>
        ) : activeTab === 'users' ? (
          <div className="accounts-container">
            <div className="account-form-card">
              <h2>Create New User</h2>
              <form onSubmit={handleAddAccount} className="login-form">
                <div className="field">
                  <label>Company / Shop Name</label>
                  <input value={newCompany} onChange={e => setNewCompany(e.target.value)} placeholder="e.g. Campus Prints" required />
                </div>
                <div className="field">
                  <label>Username</label>
                  <input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="e.g. johnsmith" required />
                </div>
                <div className="field">
                  <label>Login PIN (4-digits)</label>
                  <input value={newPin} onChange={e => setNewPin(e.target.value)} type="password" maxLength={4} placeholder="••••" required />
                </div>
                <button type="submit" className="btn-primary btn-full" style={{ marginTop: '8px' }}>Create Account</button>
              </form>
            </div>

            <div className="order-table-wrap">
              <table className="order-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Company / Shop</th>
                    <th>Role</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map(acc => (
                    <tr key={acc.id || acc.username}>
                      <td style={{ fontWeight: '600' }}>{acc.username}</td>
                      <td>{acc.company}</td>
                      <td>
                        <span className={`role-pill ${acc.role === 'admin' ? 'admin' : ''}`}>
                          {acc.role}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-advance" 
                            style={{ padding: '4px 10px' }}
                            onClick={() => { setSelectedAccount(acc); setShowChangePasswordModal(true); }}
                            disabled={acc.username === 'admin'}
                            Style={{ opacity: acc.username === 'admin' ? 0.5 : 1, padding: '4px 10px' }}
                          >
                            Change PIN
                          </button>
                          <button 
                            className="btn-danger" 
                            onClick={() => onDeleteAccount(acc.username)}
                            disabled={acc.username === 'admin'} // prevent deleting default master
                            style={{ opacity: acc.username === 'admin' ? 0.5 : 1 }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <>
            {/* No filters for both tabs - monitoring only */}
            <div style={{ marginBottom: '20px' }}></div>

            {filteredOrders.length === 0 ? (
              <div className="empty-state">No orders found in this view.</div>
            ) : (
              <div className="order-table-wrap">
                <table className="order-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => (
                      <tr key={order.id}>
                        <td className="order-id">{order.id}</td>
                        <td>
                          <div className="customer-name">{order.name}</div>
                          <div className="customer-email">{order.email}</div>
                        </td>
                        <td className="order-price">PHP {order.price}</td>
                        <td><span className={`status-pill ${STATUS_COLORS[order.status]}`}>{order.status}</span></td>
                        <td>
                          <div className="action-buttons">
                            {/* Super admin can only view active queue, not accept/decline (advance) */}
                            {activeTab === 'completed' && order.status !== 'Completed' && (
                              <button
                                className="btn-advance"
                                style={{ padding: '4px 10px' }}
                                onClick={() => onAdvance(order.id, NEXT_STATUS[order.status])}
                              >
                                Advance
                              </button>
                            )}
                            {activeTab === 'queue' && (
                              <span style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic' }}>
                                View Only
                              </span>
                            )}
                            {activeTab === 'completed' && (
                              <button
                                className="btn-danger"
                                onClick={() => onDelete(order.id)}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      {/* Change Password Modal */}
      {showChangePasswordModal && selectedAccount && (
        <ChangePasswordModal
          account={selectedAccount}
          onClose={() => { setShowChangePasswordModal(false); setSelectedAccount(null); }}
          onSubmit={(newPin) => {
            onChangePassword(selectedAccount.username, newPin);
            setShowChangePasswordModal(false);
            setSelectedAccount(null);
          }}
        />
      )}
    </div>
  )
}

// ── Change Password Modal ─────────────────────────────────────────────────────
function ChangePasswordModal({ account, onClose, onSubmit }) {
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!newPin || newPin.length !== 4) {
      setError('PIN must be exactly 4 digits')
      return
    }

    if (newPin !== confirmPin) {
      setError('PINs do not match')
      return
    }

    if (!/^\d{4}$/.test(newPin)) {
      setError('PIN must contain only numbers')
      return
    }

    onSubmit(newPin)
  }

  return (
    <div className="modal-overlay">
      <div className="login-modal">
        <h2>Change PIN Code</h2>
        <p>Update the login PIN for <strong>{account.username}</strong> ({account.company})</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="field">
            <label>New PIN (4-digits)</label>
            <input
              type="password"
              maxLength={4}
              autoFocus
              value={newPin}
              onChange={e => { setError(''); setNewPin(e.target.value); }}
              placeholder="••••"
              style={{ letterSpacing: '8px', fontWeight: 'bold' }}
              required
            />
          </div>
          <div className="field">
            <label>Confirm PIN</label>
            <input
              type="password"
              maxLength={4}
              value={confirmPin}
              onChange={e => { setError(''); setConfirmPin(e.target.value); }}
              placeholder="••••"
              style={{ letterSpacing: '8px', fontWeight: 'bold' }}
              required
            />
          </div>
          {error && <div className="error" style={{ marginBottom: '16px' }}>{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Update PIN</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Authentication Modal ───────────────────────────────────────────────────
// loginType: 'staff' | 'admin'
function LoginModal({ accounts, onClose, onLogin, loginType = 'staff' }) {
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  const isAdmin = loginType === 'admin'

  // Filter accounts by role so each portal only sees its own role
  const eligibleAccounts = accounts.filter(a => a.role === (isAdmin ? 'admin' : 'staff'))

  const handleSubmit = e => {
    e.preventDefault()
    setError('')

    const account = eligibleAccounts.find(a => a.username === username && a.pin === pin)
    if (account) {
      onLogin(account)
    } else {
      setError(isAdmin ? 'Invalid admin credentials.' : 'Invalid username or PIN code.')
      setPin('')
    }
  }

  return (
    <div className="modal-overlay">
      <div className={`login-modal ${isAdmin ? 'admin-login-modal' : ''}`}>
        {isAdmin && (
          <div className="admin-login-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Restricted Access
          </div>
        )}
        <h2>{isAdmin ? 'Super Admin Login' : 'Login'}</h2>
        <p>
          {isAdmin
            ? 'This area is restricted to authorized administrators only.'
            : 'Please enter your staff credentials to access the portal.'}
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="field">
            <label>Username</label>
            <input
              type="text"
              autoFocus
              value={username}
              onChange={e => { setError(''); setUsername(e.target.value) }}
              placeholder={isAdmin ? 'Admin username' : 'Staff username'}
              required
            />
          </div>
          <div className="field">
            <label>PIN Code (4-digits)</label>
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={e => { setError(''); setPin(e.target.value) }}
              placeholder="••••"
              style={{ letterSpacing: '8px', fontWeight: 'bold' }}
              required
            />
          </div>
          {error && <div className="error" style={{ marginBottom: '16px' }}>{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className={isAdmin ? 'btn-admin-login' : 'btn-primary'}>Login</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Track Order Page ──────────────────────────────────────────────────────────
function TrackOrderPage({ orders, onHomeClick }) {
  const [orderId, setOrderId] = useState('')
  const [email, setEmail] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [error, setError] = useState('')
  const [isSearched, setIsSearched] = useState(false)

  const handleSearch = (e) => {
    e.preventDefault()
    setError('')
    setSearchResult(null)
    setIsSearched(true)

    if (!orderId.trim()) {
      setError('Please enter an Order ID')
      return
    }

    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }

    // Find the order
    const order = orders.find(
      o => o.id.toUpperCase() === orderId.trim().toUpperCase() && 
           o.email.toLowerCase() === email.trim().toLowerCase()
    )

    if (!order) {
      setError('Order not found. Please check your Order ID and email address.')
      return
    }

    setSearchResult(order)
  }

  const getStatusColor = (status) => {
    const colors = {
      Pending: '#F5A623',
      Accepted: '#2255C9',
      Printing: '#7c3aed',
      Ready: '#F5A623',
      Completed: '#16a34a'
    }
    return colors[status] || '#64748b'
  }

  const getStatusMessage = (status) => {
    const messages = {
      Pending: 'Your order is in queue and will be processed shortly.',
      Accepted: 'Great news! Your order has been accepted and is being printed.',
      Printing: 'Your document is currently being printed.',
      Ready: '🎉 Your order is ready for pickup! Please visit our print shop.',
      Completed: 'Thank you! Your order has been completed.'
    }
    return messages[status] || 'Processing your order...'
  }

  return (
    <div className="page animate-fade-in home-page-with-clouds">
      {/* Matrix Background */}
      <div className="cloud-shader-background">
        <MatrixBackground color="#2255C9" fontSize={14} speed={0.8} />
      </div>

      {/* Content Overlay */}
      <div className="home-content-overlay">
        <header className="site-header">
          <div className="logo" onClick={onHomeClick}>
            <img src="/logo.png" alt="QReady Logo" className="logo-image" />
          </div>
          <nav>
            <button className="nav-link" onClick={onHomeClick}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Home
            </button>
          </nav>
        </header>

        <main className="form-main">
          <div className="form-card" style={{ maxWidth: '680px' }}>
            <div className="form-card-header">
              <h1>Track Your Order</h1>
              <p>Enter your Order ID and email address to check your order status.</p>
            </div>

            {!searchResult ? (
              <form onSubmit={handleSearch} style={{ padding: '32px 40px' }}>
                <div className="field">
                  <label>Order ID</label>
                  <input
                    type="text"
                    value={orderId}
                    onChange={e => { setError(''); setOrderId(e.target.value.toUpperCase()) }}
                    placeholder="QR-XXXXX"
                    autoFocus
                  />
                </div>

                <div className="field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setError(''); setEmail(e.target.value) }}
                    placeholder="your.email@example.com"
                  />
                </div>

                {error && <div className="error" style={{ marginBottom: '16px' }}>{error}</div>}

                <button type="submit" className="btn-primary btn-full btn-lg">
                  Track Order
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </button>
              </form>
            ) : (
              <div style={{ padding: '32px 40px' }}>
                {/* Order Found - Show Details */}
                <div className="confirm-badge" style={{ marginBottom: '20px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  Order Found
                </div>

                <div style={{ 
                  background: `linear-gradient(135deg, ${getStatusColor(searchResult.status)}15 0%, ${getStatusColor(searchResult.status)}08 100%)`,
                  border: `2px solid ${getStatusColor(searchResult.status)}40`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  marginBottom: '24px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>
                    Current Status
                  </div>
                  <div style={{ 
                    fontSize: '32px', 
                    fontWeight: '900', 
                    color: getStatusColor(searchResult.status),
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '-0.5px'
                  }}>
                    {searchResult.status}
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5' }}>
                    {getStatusMessage(searchResult.status)}
                  </div>
                </div>

                {/* Order Details */}
                <div className="confirm-details" style={{ marginBottom: '24px' }}>
                  <div className="detail-row"><span>Order ID</span><span style={{ fontWeight: '700', color: '#2255C9' }}>{searchResult.id}</span></div>
                  <div className="detail-row"><span>Customer</span><span>{searchResult.name}</span></div>
                  <div className="detail-row"><span>Email</span><span>{searchResult.email}</span></div>
                  <div className="detail-row"><span>Document</span><span>{searchResult.fileName}</span></div>
                  <div className="detail-row"><span>Paper Size</span><span>{searchResult.paperSize}</span></div>
                  <div className="detail-row"><span>Color Mode</span><span>{searchResult.colorMode}</span></div>
                  <div className="detail-row"><span>Sides</span><span>{searchResult.sides}</span></div>
                  <div className="detail-row"><span>Copies</span><span>{searchResult.copies}</span></div>
                  <div className="detail-row"><span>Binding</span><span>{searchResult.binding}</span></div>
                  <div className="detail-row"><span>Pages</span><span>{searchResult.pages}</span></div>
                  <div className="detail-row"><span>Payment</span><span>{searchResult.paymentMethod}</span></div>
                  <div className="detail-row total-row"><span>Total</span><span>PHP {searchResult.price}</span></div>
                  <div className="detail-row"><span>Order Date</span><span>{new Date(searchResult.createdAt).toLocaleString()}</span></div>
                </div>

                {/* Progress Timeline */}
                <div style={{ 
                  background: 'rgba(0, 20, 60, 0.6)',
                  border: '1px solid rgba(34, 85, 201, 0.3)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px 24px',
                  marginBottom: '24px'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2255C9', marginBottom: '16px' }}>
                    Order Progress
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                    {['Pending', 'Accepted', 'Printing', 'Ready', 'Completed'].map((status, index) => {
                      const currentIndex = ['Pending', 'Accepted', 'Printing', 'Ready', 'Completed'].indexOf(searchResult.status)
                      const isActive = index <= currentIndex
                      return (
                        <div key={status} style={{ 
                          flex: 1, 
                          textAlign: 'center',
                          position: 'relative',
                          zIndex: 1
                        }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: isActive ? getStatusColor(status) : 'rgba(255,255,255,0.1)',
                            border: `2px solid ${isActive ? getStatusColor(status) : 'rgba(255,255,255,0.2)'}`,
                            margin: '0 auto 8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '11px',
                            fontWeight: '700'
                          }}>
                            {isActive ? '✓' : index + 1}
                          </div>
                          <div style={{ 
                            fontSize: '10px', 
                            color: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                            fontWeight: isActive ? '600' : '400',
                            textTransform: 'uppercase',
                            letterSpacing: '0.3px'
                          }}>
                            {status}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <button 
                  className="btn-secondary btn-full" 
                  onClick={() => { setSearchResult(null); setOrderId(''); setEmail(''); setIsSearched(false); }}
                >
                  Track Another Order
                </button>
              </div>
            )}
          </div>
        </main>

        <footer className="home-footer">
          <span>© {new Date().getFullYear()} QReady Print Services. All rights reserved.</span>
        </footer>
      </div>
    </div>
  )
}

// ── Login Page ────────────────────────────────────────────────────────────────
function LoginPage({ onLogin, onHomeClick }) {
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = e => {
    e.preventDefault()
    setError('')
    
    if (!username.trim()) {
      setError('Username is required')
      return
    }
    if (!pin || pin.length !== 4) {
      setError('PIN must be 4 digits')
      return
    }

    onLogin(username, pin)
  }

  return (
    <div className="page animate-fade-in home-page-with-clouds">
      {/* Matrix Background */}
      <div className="cloud-shader-background">
        <MatrixBackground color="#2255C9" fontSize={14} speed={0.8} />
      </div>

      {/* Content Overlay */}
      <div className="home-content-overlay">
        <header className="site-header">
          <div className="logo" onClick={onHomeClick}>
            <img src="/logo.png" alt="QReady Logo" className="logo-image" />
          </div>
          <nav>
            <button className="nav-link" onClick={onHomeClick}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Home
            </button>
          </nav>
        </header>

        <main className="form-main" style={{ justifyContent: 'flex-end', paddingRight: '80px' }}>
          <div className="form-card" style={{ maxWidth: '480px' }}>
            <div className="form-card-header">
              <h1>Shop Owner Login</h1>
              <p>Sign in to access your dashboard and manage print orders.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '32px 40px' }}>
              <div className="field">
                <label>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => { setError(''); setUsername(e.target.value) }}
                  placeholder="Enter your username"
                  autoFocus
                />
              </div>

              <div className="field">
                <label>PIN Code</label>
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={e => { setError(''); setPin(e.target.value) }}
                  placeholder="••••"
                  style={{ letterSpacing: '8px', fontWeight: 'bold' }}
                />
              </div>

              {error && <div className="error" style={{ marginBottom: '16px' }}>{error}</div>}

              <button type="submit" className="btn-primary btn-full btn-lg" style={{ marginTop: '8px' }}>
                Sign In
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              </button>
            </form>
          </div>
        </main>

        <footer className="home-footer">
          <span>© 2025 QReady Print Services. All rights reserved.</span>
        </footer>
      </div>
    </div>
  )
}

// ── Main App Container ────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState('home')
  const [showLogin, setShowLogin] = useState(false)       // Staff portal login
  const [showAdminLogin, setShowAdminLogin] = useState(false) // Super admin login
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('qready_current_user')
    return savedUser ? JSON.parse(savedUser) : null
  })
  const [toast, setToast] = useState(null)
  const [footerClickCount, setFooterClickCount] = useState(0)
  const footerClickTimer = useState(null)
  
  // ── Accounts State ──
  const [accounts, setAccounts] = useState(() => {
    const saved = localStorage.getItem('qready_accounts')
    if (saved) {
      try { return JSON.parse(saved) } catch(e) { console.error(e) }
    }
    // Default master account
    return [
      { id: '1', username: 'admin', pin: '9999', company: 'Master HQ', role: 'admin' },
      { id: '2', username: 'staff1', pin: '1234', company: 'Campus Prints', role: 'staff' }
    ]
  })

  // ── Orders State ──
  const [orders, setOrders] = useState([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(true)

  // Load orders from Supabase on mount
  useEffect(() => {
    async function loadOrders() {
      if (isSupabaseConfigured()) {
        console.log('📡 Loading orders from Supabase...')
        const supabaseOrders = await getAllOrders()
        if (supabaseOrders) {
          setOrders(supabaseOrders)
          console.log(`✅ Loaded ${supabaseOrders.length} orders from Supabase`)
        } else {
          // Fallback to localStorage
          const saved = localStorage.getItem('qready_orders')
          if (saved) {
            try { 
              setOrders(JSON.parse(saved))
              console.log('⚠️ Using localStorage fallback')
            } catch (e) { console.error(e) }
          }
        }
      } else {
        // Use localStorage if Supabase not configured
        console.log('⚠️ Supabase not configured, using localStorage')
        const saved = localStorage.getItem('qready_orders')
        if (saved) {
          try { setOrders(JSON.parse(saved)) } catch (e) { console.error(e) }
        } else {
          // Default sample orders
          setOrders([
            {
              id: 'QR-A79X2',
              name: 'Maria Santos',
              email: 'maria@univ.edu',
              fileName: 'Thesis_Final_Draft.pdf',
              paperSize: 'A4',
              colorMode: 'Black & White',
              sides: 'Double-sided',
              copies: 2,
              binding: 'Spiral Binding',
              pages: 45,
              price: '270.00',
              status: 'Printing',
              createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
            }
          ])
        }
      }
      setIsLoadingOrders(false)
    }
    
    loadOrders()
  }, [])

  // Subscribe to real-time updates from Supabase
  useEffect(() => {
    if (!isSupabaseConfigured()) return

    const subscription = subscribeToOrders(async (payload) => {
      console.log('📡 Real-time update:', payload.eventType)
      // Reload all orders on any change
      const updatedOrders = await getAllOrders()
      if (updatedOrders) {
        setOrders(updatedOrders)
      }
    })

    return () => {
      if (subscription) {
        console.log('Unsubscribing from real-time updates')
        subscription.unsubscribe()
      }
    }
  }, [])

  const [lastOrder, setLastOrder] = useState(null)

  // ── Real-time Polling State ──
  const [lastPolledTime, setLastPolledTime] = useState(Date.now())
  const [isPolling, setIsPolling] = useState(false)
  const [showRefreshNotification, setShowRefreshNotification] = useState(false)

  // Persist Data (only if Supabase is not configured)
  useEffect(() => { 
    if (!isSupabaseConfigured()) {
      localStorage.setItem('qready_orders', JSON.stringify(orders))
    }
  }, [orders])
  useEffect(() => { 
    if (!isSupabaseConfigured()) {
      localStorage.setItem('qready_accounts', JSON.stringify(accounts))
    }
  }, [accounts])
  
  // Persist current view and user session
  useEffect(() => { 
    if (view) {
      localStorage.setItem('qready_current_view', view)
    }
  }, [view])
  
  useEffect(() => { 
    if (currentUser) {
      localStorage.setItem('qready_current_user', JSON.stringify(currentUser))
    } else {
      localStorage.removeItem('qready_current_user')
    }
  }, [currentUser])

  // ── Real-time Updates: Auto-refresh for Dashboards ──
  useEffect(() => {
    // Only poll when on staff or admin dashboards
    const shouldPoll = view === 'staff' || view === 'admin'
    
    if (!shouldPoll) {
      setIsPolling(false)
      return
    }

    setIsPolling(true)

    // Poll every 5 seconds
    const pollInterval = setInterval(() => {
      // Simulate checking for updates by refreshing localStorage
      // In a real app, this would fetch from a backend API
      const savedOrders = localStorage.getItem('qready_orders')
      if (savedOrders) {
        try {
          const parsedOrders = JSON.parse(savedOrders)
          // Check if data has changed
          const currentOrdersString = JSON.stringify(orders)
          const newOrdersString = JSON.stringify(parsedOrders)
          
          if (newOrdersString !== currentOrdersString) {
            setOrders(parsedOrders)
            console.log('📡 Orders auto-refreshed')
            
            // Show refresh notification
            setShowRefreshNotification(true)
            setTimeout(() => setShowRefreshNotification(false), 3000)
          }
        } catch (e) {
          console.error('Polling error:', e)
        }
      }
      setLastPolledTime(Date.now())
    }, 5000) // Poll every 5 seconds

    // Cleanup on unmount or view change
    return () => {
      clearInterval(pollInterval)
      setIsPolling(false)
    }
  }, [view]) // Remove orders from dependency to avoid infinite loop

  const triggerToast = message => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const navigateTo = (newView) => {
    setView(newView)
    localStorage.setItem('qready_current_view', newView)
    window.location.hash = ''
    window.scrollTo(0, 0)
  }

  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem('qready_current_user')
    localStorage.setItem('qready_current_view', 'home')
    navigateTo('home')
  }

  // Secret footer click handler — triple-click opens admin login
  const handleFooterSecretClick = () => {
    setFooterClickCount(prev => {
      const next = prev + 1
      if (next >= 3) {
        setShowAdminLogin(true)
        return 0
      }
      // Reset counter after 1.5s of inactivity
      clearTimeout(footerClickTimer[0])
      footerClickTimer[0] = setTimeout(() => setFooterClickCount(0), 1500)
      return next
    })
  }

  // Staff portal login — only staff-role accounts
  const handleStaffLogin = (username, pin) => {
    const account = accounts.find(acc => 
      acc.username === username && 
      acc.pin === pin && 
      acc.role === 'staff'
    )
    
    if (!account) {
      showToast('❌ Invalid credentials or not a staff account')
      return
    }
    
    setCurrentUser(account)
    navigateTo('staff')
    showToast(`✓ Welcome, ${account.username}!`)
  }

  // Super admin login — only admin-role accounts
  const handleAdminLogin = (account) => {
    setCurrentUser(account)
    setShowAdminLogin(false)
    navigateTo('admin')
  }

  const handleSubmitOrder = async (form) => {
    const details = computePriceDetails(form, form.pages)
    const order = {
      id: generateOrderId(),
      name: form.name,
      email: form.email,
      fileName: form.fileName || 'Document.pdf',
      paperSize: form.paperSize,
      colorMode: form.colorMode,
      sides: form.sides,
      copies: form.copies,
      binding: form.binding,
      pages: form.pages,
      price: details.total,
      paymentMethod: form.paymentMethod || 'Cash',
      status: 'Pending',
      createdAt: new Date().toISOString(),
    }
    
    // Save to Supabase if configured, otherwise localStorage
    if (isSupabaseConfigured()) {
      const saved = await createOrder(order)
      if (saved) {
        // Reload orders from Supabase
        const allOrders = await getAllOrders()
        if (allOrders) setOrders(allOrders)
      }
    } else {
      setOrders(prev => [order, ...prev])
    }
    
    setLastOrder(order)
    
    // Send confirmation email ONLY for cash payments
    // For online payments, email will be sent after successful payment
    const isOnlinePayment = form.paymentMethod && 
                           (form.paymentMethod.includes('GCash') || 
                            form.paymentMethod.includes('Maya') ||
                            form.paymentMethod.includes('(Online)'))
    
    if (!isOnlinePayment) {
      // Cash payment - send email immediately
      const emailResult = await sendOrderConfirmation(order)
      if (emailResult.success) {
        triggerToast('✓ Order placed! Confirmation email sent.')
      } else if (isEmailConfigured()) {
        triggerToast('⚠ Order placed but email failed to send')
      } else {
        triggerToast('✓ Order placed successfully!')
      }
    } else {
      // Online payment - email will be sent after payment confirmation
      triggerToast('✓ Order created! Complete payment to receive confirmation.')
    }
    
    navigateTo('confirm')
  }

  const handleAdvance = async (id, nextStatus) => {
    // Update order in Supabase if configured
    if (isSupabaseConfigured()) {
      const updated = await updateOrder(id, { status: nextStatus })
      if (updated) {
        // Reload orders
        const allOrders = await getAllOrders()
        if (allOrders) setOrders(allOrders)
        
        // Send email for important status changes
        if (['Accepted', 'Ready', 'Completed'].includes(nextStatus)) {
          await sendOrderStatusUpdate(updated, nextStatus)
        }
      }
    } else {
      // localStorage fallback
      let updatedOrder = null
      setOrders(prev =>
        prev.map(o => {
          if (o.id === id) {
            updatedOrder = { ...o, status: nextStatus }
            return updatedOrder
          }
          return o
        })
      )
      
      // Send email for important status changes
      if (updatedOrder && ['Accepted', 'Ready', 'Completed'].includes(nextStatus)) {
        await sendOrderStatusUpdate(updatedOrder, nextStatus)
      }
    }
    
    triggerToast(`Order ${id} advanced to ${nextStatus}`)
  }

  const handleDelete = async (id) => {
    if (window.confirm(`Permanently delete order ${id}?`)) {
      if (isSupabaseConfigured()) {
        await deleteOrder(id)
        const allOrders = await getAllOrders()
        if (allOrders) setOrders(allOrders)
      } else {
        setOrders(prev => prev.filter(o => o.id !== id))
      }
      triggerToast(`Order ${id} deleted`)
    }
  }

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to completely wipe all orders?')) {
      if (isSupabaseConfigured()) {
        await deleteAllOrders()
        setOrders([])
      } else {
        setOrders([])
      }
      triggerToast('All orders cleared from system.')
    }
  }

  // Account management handlers
  const handleAddAccount = (newAcc) => {
    setAccounts(prev => [...prev, newAcc])
    triggerToast(`User ${newAcc.username} created.`)
  }

  const handleDeleteAccount = (username) => {
    if (window.confirm(`Are you sure you want to delete user: ${username}?`)) {
      setAccounts(prev => prev.filter(a => a.username !== username))
      triggerToast(`User deleted.`)
    }
  }

  const handleChangePassword = (username, newPin) => {
    setAccounts(prev => prev.map(a => 
      a.username === username ? { ...a, pin: newPin } : a
    ))
    triggerToast(`PIN updated for ${username}.`)
  }

  return (
    <>
      {toast && (
        <div className="toast-container">
          <div className="toast">
            <span className="toast-icon">✓</span>
            <span>{toast}</span>
          </div>
        </div>
      )}

      {showRefreshNotification && (view === 'staff' || view === 'admin') && (
        <div className="refresh-notification">
          <span>🔄</span> Dashboard updated with new data
        </div>
      )}

      {showLogin && (
        <LoginModal
          accounts={accounts}
          onLogin={handleStaffLogin}
          onClose={() => setShowLogin(false)}
          loginType="staff"
        />
      )}

      {showAdminLogin && (
        <LoginModal
          accounts={accounts}
          onLogin={handleAdminLogin}
          onClose={() => setShowAdminLogin(false)}
          loginType="admin"
        />
      )}

      {view === 'home' && (
        <HomeDashboard
          onPlaceOrder={() => navigateTo('form')}
          onTrackOrder={() => navigateTo('track')}
          onStaffClick={() => navigateTo('login')}
          onAdminSecretClick={handleFooterSecretClick}
        />
      )}

      {view === 'admin' && (
        <SuperAdminDashboard
          orders={orders}
          user={currentUser}
          accounts={accounts}
          onAddAccount={handleAddAccount}
          onDeleteAccount={handleDeleteAccount}
          onChangePassword={handleChangePassword}
          onAdvance={handleAdvance}
          onDelete={handleDelete}
          onClearAll={handleClearAll}
          onHomeClick={handleLogout}
          onStaffClick={() => navigateTo('staff')}
          onPlaceOrder={() => navigateTo('form')}
          isPolling={isPolling}
        />
      )}

      {view === 'staff' && (
        <StaffDashboard
          orders={orders}
          user={currentUser}
          onAdvance={handleAdvance}
          onHomeClick={handleLogout}
          isPolling={isPolling}
        />
      )}

      {view === 'confirm' && lastOrder && (
        <Confirmation
          order={lastOrder}
          queuePos={orders.findIndex(o => o.id === lastOrder.id) + 1 || 1}
          onNewOrder={() => navigateTo('form')}
          onHomeClick={() => navigateTo('home')}
        />
      )}

      {view === 'form' && (
        <OrderForm
          onSubmit={handleSubmitOrder}
          onHomeClick={() => navigateTo('home')}
          onStaffClick={() => navigateTo('login')}
        />
      )}

      {view === 'login' && (
        <LoginPage
          onLogin={handleStaffLogin}
          onHomeClick={() => navigateTo('home')}
        />
      )}

      {view === 'track' && (
        <TrackOrderPage
          orders={orders}
          onHomeClick={() => navigateTo('home')}
        />
      )}
    </>
  )
}
