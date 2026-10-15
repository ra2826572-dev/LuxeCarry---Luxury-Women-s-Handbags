import React, { useEffect, useState, useRef } from 'react';
import {
  CheckCircle,
  Truck,
  Package,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Printer,
  Camera,
  Download,
  Mail,
  ExternalLink,
  Eye,
  RefreshCw,
  Check,
  X,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { Order } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface OrderConfirmationPageProps {
  orderId?: string;
  orderData?: Order;
  onNavigate: (page: string, params?: any) => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({
  orderId,
  orderData: initialOrderData,
  onNavigate,
}) => {
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(initialOrderData || null);
  const [loading, setLoading] = useState(!initialOrderData && !!orderId);

  // Screenshot and email states
  const receiptCardRef = useRef<HTMLDivElement>(null);
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [screenshotState, setScreenshotState] = useState<
    'idle' | 'capturing' | 'sending' | 'sent' | 'error'
  >('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const hasCapturedRef = useRef(false);

  useEffect(() => {
    if (!order && orderId) {
      fetch(`/api/orders/${orderId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && data.id) setOrder(data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [orderId, order]);

  // Determine recipient email (order customer has highest priority, fallback to logged-in user)
  const defaultEmail = order?.customer?.email || user?.email || '';
  const [recipientEmail, setRecipientEmail] = useState<string>(defaultEmail);
  const [isEditingEmail, setIsEditingEmail] = useState<boolean>(false);
  const [customEmailInput, setCustomEmailInput] = useState<string>(defaultEmail);

  useEffect(() => {
    if (!recipientEmail) {
      const email = order?.customer?.email || user?.email || '';
      if (email) {
        setRecipientEmail(email);
        setCustomEmailInput(email);
      }
    }
  }, [order, user, recipientEmail]);

  // Helper to render high quality canvas receipt fallback if needed
  const renderCanvasReceipt = (currentOrder: Order, targetEmail: string): string => {
    try {
      const canvas = document.createElement('canvas');
      const width = 850;
      const padding = 40;
      const itemRowHeight = 65;
      const itemsCount = Math.max(1, currentOrder.items?.length || 1);
      const height = 660 + itemsCount * itemRowHeight;

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      // Cream background
      ctx.fillStyle = '#FAF8F5';
      ctx.fillRect(0, 0, width, height);

      // Gold border
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 3;
      ctx.strokeRect(16, 16, width - 32, height - 32);

      ctx.strokeStyle = '#E7DFC6';
      ctx.lineWidth = 1;
      ctx.strokeRect(24, 24, width - 48, height - 48);

      // Header
      ctx.fillStyle = '#1A1A1A';
      ctx.font = 'bold 26px serif';
      ctx.textAlign = 'center';
      ctx.fillText('LUXECARRY ATELIER', width / 2, 70);

      ctx.fillStyle = '#A37B24';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('OFFICIAL COMMISSION RECEIPT & VERIFIED ORDER INVOICE', width / 2, 95);

      // Separator line
      ctx.strokeStyle = '#E0D8C8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, 115);
      ctx.lineTo(width - padding, 115);
      ctx.stroke();

      // Order meta strip
      ctx.textAlign = 'left';
      ctx.fillStyle = '#FAF4EB';
      ctx.fillRect(padding, 130, width - padding * 2, 60);
      ctx.strokeStyle = '#DDD3BF';
      ctx.strokeRect(padding, 130, width - padding * 2, 60);

      ctx.fillStyle = '#666';
      ctx.font = '10px sans-serif';
      ctx.fillText('COMMISSION ID', padding + 16, 150);
      ctx.fillText('ORDER DATE', padding + 220, 150);
      ctx.fillText('PAYMENT METHOD', padding + 400, 150);
      ctx.fillText('DISPATCH RECIPIENT', padding + 580, 150);

      ctx.fillStyle = '#111';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(currentOrder.id, padding + 16, 172);

      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(new Date(currentOrder.createdAt).toLocaleDateString(), padding + 220, 172);
      ctx.fillText(
        currentOrder.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Card Payment',
        padding + 400,
        172
      );

      ctx.fillStyle = '#1e3a8a';
      const emailDisplay = targetEmail.length > 24 ? targetEmail.substring(0, 22) + '...' : targetEmail;
      ctx.fillText(emailDisplay, padding + 580, 172);

      // Customer info block
      let y = 220;
      ctx.fillStyle = '#111';
      ctx.font = 'bold 14px serif';
      ctx.fillText('Customer & Delivery Information', padding, y);

      y += 20;
      ctx.fillStyle = '#444';
      ctx.font = '12px sans-serif';
      ctx.fillText(`Client Name: ${currentOrder.customer.fullName}`, padding, y);
      y += 18;
      ctx.fillText(
        `Delivery Address: ${currentOrder.customer.street}, ${currentOrder.customer.city}, ${currentOrder.customer.postalCode || ''} ${currentOrder.customer.country || ''}`,
        padding,
        y
      );
      y += 18;
      ctx.fillText(`Phone: ${currentOrder.customer.phone} | Notification Email: ${targetEmail}`, padding, y);

      // Items table header
      y += 35;
      ctx.fillStyle = '#111';
      ctx.font = 'bold 14px serif';
      ctx.fillText('Commission Items Breakdown', padding, y);

      y += 15;
      ctx.fillStyle = '#EDE7DC';
      ctx.fillRect(padding, y, width - padding * 2, 28);
      ctx.fillStyle = '#555';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('ITEM / ATELIER EDITION', padding + 12, y + 18);
      ctx.fillText('QTY', width - padding - 220, y + 18);
      ctx.fillText('PRICE', width - padding - 140, y + 18);
      ctx.fillText('TOTAL', width - padding - 60, y + 18);

      y += 28;
      // Items list
      currentOrder.items.forEach((item, idx) => {
        ctx.fillStyle = idx % 2 === 0 ? '#FFFFFF' : '#FAF8F5';
        ctx.fillRect(padding, y, width - padding * 2, itemRowHeight - 10);
        ctx.strokeStyle = '#F0EAE1';
        ctx.strokeRect(padding, y, width - padding * 2, itemRowHeight - 10);

        ctx.fillStyle = '#111';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(item.productName, padding + 16, y + 25);

        ctx.fillStyle = '#777';
        ctx.font = '11px sans-serif';
        ctx.fillText(`Colorway: ${item.colorName} · SKU: ${item.sku}`, padding + 16, y + 43);

        ctx.fillStyle = '#333';
        ctx.font = '12px sans-serif';
        ctx.fillText(`${item.quantity}x`, width - padding - 215, y + 32);
        ctx.fillText(`$${(item.unitPrice || 0).toFixed(2)}`, width - padding - 140, y + 32);

        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`$${(item.subtotal || (item.unitPrice || 0) * item.quantity).toFixed(2)}`, width - padding - 60, y + 32);

        y += itemRowHeight;
      });

      // Totals box
      y += 10;
      const totalsBoxWidth = 320;
      const totalsX = width - padding - totalsBoxWidth;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(totalsX, y, totalsBoxWidth, 130);
      ctx.strokeStyle = '#DDD3BF';
      ctx.strokeRect(totalsX, y, totalsBoxWidth, 130);

      ctx.fillStyle = '#555';
      ctx.font = '12px sans-serif';
      ctx.fillText('Subtotal:', totalsX + 20, y + 30);
      ctx.textAlign = 'right';
      ctx.fillText(`$${currentOrder.subtotal.toFixed(2)}`, totalsX + totalsBoxWidth - 20, y + 30);

      ctx.textAlign = 'left';
      ctx.fillText('White Glove Delivery:', totalsX + 20, y + 55);
      ctx.textAlign = 'right';
      ctx.fillText(
        (currentOrder.shippingCost || 0) === 0
          ? 'COMPLIMENTARY'
          : `$${(currentOrder.shippingCost || 0).toFixed(2)}`,
        totalsX + totalsBoxWidth - 20,
        y + 55
      );

      ctx.strokeStyle = '#E5E0D4';
      ctx.beginPath();
      ctx.moveTo(totalsX + 15, y + 70);
      ctx.lineTo(totalsX + totalsBoxWidth - 15, y + 70);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#111';
      ctx.font = 'bold 15px serif';
      ctx.fillText('Grand Total:', totalsX + 20, y + 102);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#A37B24';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(`$${currentOrder.totalAmount.toFixed(2)}`, totalsX + totalsBoxWidth - 20, y + 102);

      // Footer / Verification Seal
      ctx.textAlign = 'center';
      ctx.fillStyle = '#24542B';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('✓ CERTIFIED ATELIER COMMISSION RECEIPT · LUXECARRY GENUINE GUARANTEE', width / 2, height - 60);

      ctx.fillStyle = '#888';
      ctx.font = '10px sans-serif';
      ctx.fillText(`Automatic notification sent to user account email: ${targetEmail}`, width / 2, height - 42);

      return canvas.toDataURL('image/png');
    } catch (e) {
      console.error('Canvas receipt fallback generation error:', e);
      return '';
    }
  };

  // Function to take screenshot and send email
  const captureScreenshotAndSend = async (currentOrder: Order, emailOverride?: string) => {
    if (screenshotState === 'capturing' || screenshotState === 'sending') return;

    const emailToSend = (emailOverride || recipientEmail || currentOrder.customer?.email || user?.email || '').trim();
    if (!emailToSend) {
      setScreenshotState('error');
      setStatusMessage('Please enter an email address to receive the receipt.');
      return;
    }

    try {
      setScreenshotState('capturing');
      setStatusMessage('Capturing high-definition receipt screenshot...');

      // Small delay to allow images and styles to settle
      await new Promise((resolve) => setTimeout(resolve, 600));

      let dataUrl = '';
      if (receiptCardRef.current) {
        try {
          dataUrl = await toPng(receiptCardRef.current, {
            cacheBust: true,
            pixelRatio: 2,
            backgroundColor: '#FAF8F5',
            skipFonts: true,
          });
        } catch (captureErr) {
          console.warn('html-to-image DOM capture warning, using canvas receipt fallback:', captureErr);
        }
      }

      // If toPng produced empty string or failed, use canvas receipt
      if (!dataUrl || !dataUrl.startsWith('data:image') || dataUrl.length < 100) {
        dataUrl = renderCanvasReceipt(currentOrder, emailToSend);
      }

      setScreenshotDataUrl(dataUrl);

      setScreenshotState('sending');
      setStatusMessage(`Transmitting receipt screenshot to ${emailToSend}...`);

      const token = localStorage.getItem('luxecarry_token');
      const res = await fetch(`/api/orders/${currentOrder.id}/send-screenshot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          screenshotBase64: dataUrl,
          recipientEmail: emailToSend,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setScreenshotState('sent');
        const resolvedEmail = data.recipientEmail || emailToSend;
        setRecipientEmail(resolvedEmail);
        setStatusMessage(
          `Official order screenshot & invoice dispatched to ${resolvedEmail}`
        );
      } else {
        setScreenshotState('error');
        setStatusMessage(data.error || 'Failed to dispatch screenshot to email.');
      }
    } catch (err: any) {
      console.error('Screenshot / email dispatch failed:', err);
      setScreenshotState('error');
      setStatusMessage(err.message || 'Error capturing and emailing order receipt.');
    }
  };

  // Trigger screenshot automatically when order is loaded and mounted
  useEffect(() => {
    if (order && !hasCapturedRef.current && recipientEmail) {
      hasCapturedRef.current = true;
      // Slight delay for images to load
      const timer = setTimeout(() => {
        captureScreenshotAndSend(order, recipientEmail);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [order, recipientEmail]);

  // Direct download handler
  const handleDownloadScreenshot = () => {
    if (!screenshotDataUrl || !order) return;
    const a = document.createElement('a');
    a.href = screenshotDataUrl;
    a.download = `LuxeCarry_Receipt_${order.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Gmail direct web compose link
  const openInGmailUrl = order
    ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
        recipientEmail
      )}&su=${encodeURIComponent(
        `LuxeCarry Order Receipt #${order.id}`
      )}&body=${encodeURIComponent(
        `Dear ${order.customer.fullName},\n\nYour LuxeCarry atelier commission #${order.id} for $${order.totalAmount.toFixed(
          2
        )} has been confirmed.\nPayment Method: ${
          order.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Card'
        }\nDelivery Address: ${order.customer.street}, ${order.customer.city}\n\nThank you for choosing LuxeCarry Atelier.`
      )}`
    : '#';

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center">
        <div className="w-12 h-12 border-3 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-neutral-600">Retrieving atelier commission record...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center">
        <h2 className="text-2xl font-serif font-bold text-neutral-900 mb-2">Order Not Found</h2>
        <p className="text-sm text-neutral-500 mb-6">We could not locate this commission reference.</p>
        <button
          onClick={() => onNavigate('shop')}
          className="px-6 py-2.5 bg-neutral-900 text-white rounded-full text-xs font-semibold"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24 space-y-6">
      {/* ============================================================== */}
      {/* 1. SCREENSHOT & EMAIL NOTIFICATION STATUS BANNER (USER REQUEST) */}
      {/* ============================================================== */}
      <div className="bg-[#FAF8F5] border border-[#E5DFD4] rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#111111] text-[#D4AF37] flex items-center justify-center shrink-0 shadow-sm">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase tracking-wider font-bold text-neutral-900">
                  Receipt Screenshot Dispatch
                </span>
                {screenshotState === 'sent' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF5EC] text-[#24542B] border border-[#CDE5D2]">
                    <Check className="w-3 h-3" />
                    Sent to {recipientEmail}
                  </span>
                )}
                {(screenshotState === 'capturing' || screenshotState === 'sending') && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FFF9E6] text-[#8C6D1F] border border-[#F2DEAC]">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Processing snapshot...
                  </span>
                )}
                {screenshotState === 'error' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                    <X className="w-3 h-3" />
                    Dispatch Error
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-600 mt-1">
                {statusMessage ||
                  `A full screenshot and itemized invoice is dispatched to your account: ${recipientEmail}`}
              </p>

              {/* Inline Recipient Email Modifier */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {!isEditingEmail ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-neutral-500">Destination:</span>
                    <span className="font-semibold text-neutral-900 bg-white px-2.5 py-1 rounded-md border border-[#E5DFD4] font-mono">
                      {recipientEmail || 'No email specified'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomEmailInput(recipientEmail);
                        setIsEditingEmail(true);
                      }}
                      className="text-xs text-[#A37B24] hover:underline font-medium"
                    >
                      Change Email
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (customEmailInput.trim()) {
                        setRecipientEmail(customEmailInput.trim());
                        setIsEditingEmail(false);
                        captureScreenshotAndSend(order, customEmailInput.trim());
                      }
                    }}
                    className="flex flex-wrap items-center gap-1.5"
                  >
                    <input
                      type="email"
                      required
                      placeholder="Enter recipient email"
                      value={customEmailInput}
                      onChange={(e) => setCustomEmailInput(e.target.value)}
                      className="px-2.5 py-1 text-xs bg-white border border-[#D5CDBD] rounded-md focus:outline-none focus:border-[#A37B24] font-mono min-w-[220px]"
                    />
                    <button
                      type="submit"
                      disabled={screenshotState === 'capturing' || screenshotState === 'sending'}
                      className="px-3 py-1 bg-neutral-900 text-white rounded-md text-xs font-semibold hover:bg-black transition-colors disabled:opacity-50"
                    >
                      Send Receipt
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingEmail(false)}
                      className="px-2.5 py-1 text-xs text-neutral-600 hover:text-neutral-900"
                    >
                      Cancel
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons for Screenshot & Email */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0">
            {screenshotDataUrl && (
              <>
                <button
                  onClick={() => setPreviewOpen(true)}
                  className="px-3.5 py-2 bg-white border border-[#D5CDBD] text-neutral-800 rounded-lg text-xs font-semibold hover:bg-neutral-50 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5 text-neutral-600" />
                  <span>View Screenshot</span>
                </button>
                <button
                  onClick={handleDownloadScreenshot}
                  className="px-3.5 py-2 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Download (.PNG)</span>
                </button>
              </>
            )}

            <button
              onClick={() => captureScreenshotAndSend(order, recipientEmail)}
              disabled={screenshotState === 'capturing' || screenshotState === 'sending'}
              className="px-3.5 py-2 bg-white border border-[#D5CDBD] text-neutral-700 rounded-lg text-xs font-medium hover:bg-neutral-50 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              title="Resend Screenshot to Email"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  screenshotState === 'capturing' || screenshotState === 'sending'
                    ? 'animate-spin'
                    : ''
                }`}
              />
              <span>Resend Email</span>
            </button>

            <a
              href={openInGmailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-[#F6F4F0] border border-[#DDD5C7] text-neutral-700 rounded-lg text-xs font-medium hover:bg-[#EFECE5] transition-colors flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-red-600" />
              <span>Open in Gmail</span>
              <ExternalLink className="w-3 h-3 text-neutral-400" />
            </a>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. MAIN ORDER RECEIPT CARD (CAPTURED BY SCREENSHOT ENGINE)     */}
      {/* ============================================================== */}
      <div
        ref={receiptCardRef}
        id="order-receipt-card"
        className="bg-white rounded-2xl p-8 sm:p-12 border border-[#EAE4D7] shadow-lg text-center space-y-6"
      >
        <div className="w-16 h-16 bg-[#F2F7F2] text-[#24542B] rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-[#A37B24]">
            Atelier Commission Confirmed
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-neutral-900 mt-1">
            Thank You, {order.customer.fullName}
          </h1>
          <p className="text-sm text-neutral-600 max-w-lg mx-auto mt-2 leading-relaxed font-light">
            Your handbag has entered our handcrafted preparation queue. Verified order screenshot sent to{' '}
            <strong className="font-semibold text-neutral-900">{recipientEmail}</strong>.
          </p>
        </div>

        {/* Order Identifier Strip */}
        <div className="bg-[#FAF8F4] p-4 sm:p-6 rounded-xl border border-[#EDE7DC] flex flex-wrap items-center justify-around gap-4 text-xs">
          <div>
            <span className="text-neutral-400 uppercase tracking-wider block text-[10px]">
              Commission ID
            </span>
            <span className="font-mono font-bold text-sm text-neutral-900">{order.id}</span>
          </div>
          <div className="hidden sm:block w-px h-8 bg-[#E5DFD4]" />
          <div>
            <span className="text-neutral-400 uppercase tracking-wider block text-[10px]">
              Payment Method
            </span>
            <span className="font-semibold text-neutral-900">
              {order.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Card Payment'}
            </span>
          </div>
          <div className="hidden sm:block w-px h-8 bg-[#E5DFD4]" />
          <div>
            <span className="text-neutral-400 uppercase tracking-wider block text-[10px]">
              Status
            </span>
            <span className="font-semibold text-[#24542B] bg-[#EBF5EE] px-2 py-0.5 rounded">
              {order.status}
            </span>
          </div>
          <div className="hidden sm:block w-px h-8 bg-[#E5DFD4]" />
          <div>
            <span className="text-neutral-400 uppercase tracking-wider block text-[10px]">
              Commission Total
            </span>
            <span className="font-semibold text-neutral-900 tabular-nums">
              ${order.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Delivery Details & COD instructions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left pt-4">
          <div className="p-5 rounded-xl bg-[#FCFCFA] border border-[#EDE8DF] space-y-2 text-xs">
            <div className="flex items-center gap-2 font-semibold text-neutral-900">
              <Truck className="w-4 h-4 text-neutral-700" />
              <span>White Glove Delivery Address</span>
            </div>
            <p className="text-neutral-700 leading-relaxed">
              {order.customer.fullName}
              <br />
              {order.customer.street}
              <br />
              {order.customer.city}, {order.customer.postalCode}, {order.customer.country}
              <br />
              Tel: {order.customer.phone}
            </p>
            {order.customer.deliveryInstructions && (
              <p className="text-[11px] text-neutral-500 italic pt-1">
                Note: "{order.customer.deliveryInstructions}"
              </p>
            )}
          </div>

          <div className="p-5 rounded-xl bg-[#FCFCFA] border border-[#EDE8DF] space-y-2 text-xs">
            <div className="flex items-center gap-2 font-semibold text-neutral-900">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>Cash on Delivery Verification</span>
            </div>
            <p className="text-neutral-600 leading-relaxed text-[11px]">
              Our certified white-glove courier will present the sealed presentation box. You may
              verify the condition and pay <strong>${order.totalAmount.toFixed(2)}</strong> upon
              delivery.
            </p>
            <p className="text-[11px] text-neutral-500 font-mono">
              Estimated delivery: 2–4 business days
            </p>
          </div>
        </div>

        {/* Snapshot Items Breakdown */}
        <div className="text-left pt-6 border-t border-[#EDE7DC]">
          <h3 className="text-base font-serif font-semibold text-neutral-900 mb-4">
            Items in This Commission
          </h3>
          <div className="space-y-4">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-4 p-3 rounded-lg bg-[#FAF8F5] border border-[#EDE8DF]"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.productName}
                    crossOrigin="anonymous"
                    className="w-14 h-16 object-cover rounded bg-[#F2EDE2] border border-[#DDD5C7]"
                  />
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-900">{item.productName}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-neutral-300"
                        style={{ backgroundColor: item.colorCode }}
                      />
                      <span>{item.colorName}</span>
                      <span>·</span>
                      <span className="font-mono">{item.sku}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="text-neutral-500 block">Qty: {item.quantity}</span>
                  <span className="font-semibold text-neutral-900 tabular-nums">
                    ${item.subtotal.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Totals */}
          <div className="mt-6 pt-4 border-t border-[#EDE7DC] space-y-1.5 text-xs text-neutral-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-[#24542B] font-medium">
                <span>Discount Privilege ({order.couponCode || 'APPLIED'}):</span>
                <span>-${order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>White-Glove Shipping:</span>
              <span>
                {order.shippingCost === 0 ? 'Complimentary' : `$${order.shippingCost.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-neutral-900 pt-2 border-t border-[#EDE7DC]">
              <span>Total Commission:</span>
              <span>${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer brand stamp for screenshot watermark */}
        <div className="pt-6 border-t border-[#EDE7DC] flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-400">
          <div>LuxeCarry Handcrafted Leather Atelier · Verified Commission Record</div>
          <div className="mt-1 sm:mt-0 font-mono text-[10px]">
            Recipient: {recipientEmail}
          </div>
        </div>
      </div>

      {/* Navigation Actions */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={() => onNavigate('account', { tab: 'orders' })}
          className="w-full sm:w-auto px-6 py-3 bg-neutral-900 text-white rounded-full text-xs font-semibold hover:bg-black transition-colors flex items-center justify-center gap-2"
        >
          <span>View in My Account</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onNavigate('shop')}
          className="w-full sm:w-auto px-6 py-3 bg-white border border-[#D5CDBD] text-neutral-800 rounded-full text-xs font-semibold hover:bg-[#F2ECE0] transition-colors"
        >
          Continue Exploring Collections
        </button>
        <button
          onClick={() => window.print()}
          className="w-full sm:w-auto px-4 py-3 text-neutral-500 hover:text-black text-xs font-medium flex items-center justify-center gap-1.5"
        >
          <Printer className="w-4 h-4" />
          <span>Print Receipt</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 3. SCREENSHOT PREVIEW MODAL                                   */}
      {/* ============================================================== */}
      {previewOpen && screenshotDataUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-[#D5CDBD]">
            <div className="p-4 px-6 bg-[#FAF8F5] border-b border-[#EAE4D7] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="font-serif font-bold text-base text-neutral-900">
                  Captured Order Receipt Screenshot
                </h3>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="w-8 h-8 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-neutral-100 flex items-center justify-center">
              <img
                src={screenshotDataUrl}
                alt="Order Screenshot Receipt"
                className="max-w-full h-auto rounded-lg shadow-md border border-neutral-300"
              />
            </div>

            <div className="p-4 px-6 bg-[#FAF8F5] border-t border-[#EAE4D7] flex items-center justify-between gap-4">
              <div className="text-xs text-neutral-600">
                Dispatched to: <strong>{recipientEmail}</strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadScreenshot}
                  className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Download Image</span>
                </button>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="px-4 py-2 bg-white border border-[#D5CDBD] text-neutral-700 rounded-lg text-xs font-medium hover:bg-neutral-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
