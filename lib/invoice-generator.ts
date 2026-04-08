import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

// ── Dummy company details (replace with real values from client) ──
export const COMPANY = {
  name:    'Duromax UPVC Pvt. Ltd.',
  address: 'A-12, Okhla Industrial Area, Phase I,\nNew Delhi - 110 020',
  gstin:   '07AABCD1234E1Z5',
  pan:     'AABCD1234E',
  phone:   '+91 98765 00000',
  email:   'service@duromax.in',
  website: 'www.duromax.in',
  sac:     '998714',  // Maintenance & repair services of fabricated metal products
  state:   'Delhi',
  stateCode: '07',
}

interface InvoiceItem {
  description: string
  hsn: string
  qty: number
  unit: string
  rate: number  // in rupees
}

interface InvoiceData {
  invoiceNumber:  string
  invoiceDate:    string
  ticketNumber:   string
  clientName:     string
  clientAddress:  string
  clientMobile:   string
  clientGstin?:   string
  items:          InvoiceItem[]
  isOutstation:   boolean
  paymentStatus:  'paid' | 'unpaid'
  paymentDate?:   string
  paymentMode?:   string
  transactionId?: string
}

// Colour helpers for pdf-lib
const TEAL   = rgb(0.047, 0.431, 0.345)   // #0C6E58
const TEAL_L = rgb(0.886, 0.957, 0.933)   // #E2F4EE
const GOLD   = rgb(0.604, 0.408, 0)        // #9A6800
const INK    = rgb(0.102, 0.102, 0.094)    // #1A1A18
const MUTED  = rgb(0.42, 0.416, 0.392)     // #6B6A64
const WHITE  = rgb(1, 1, 1)
const BORDER = rgb(0.894, 0.886, 0.847)    // #E4E2D8
const RED    = rgb(0.769, 0.294, 0.169)    // #C44B2B
const GREEN  = rgb(0.0, 0.655, 0.373)

function formatCurrency(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Uint8Array> {
  const doc  = await PDFDocument.create()
  const page = doc.addPage([595, 842])  // A4
  const { width, height } = page.getSize()

  const fontR  = await doc.embedFont(StandardFonts.Helvetica)
  const fontB  = await doc.embedFont(StandardFonts.HelveticaBold)
  const fontO  = await doc.embedFont(StandardFonts.HelveticaOblique)

  const M = 40  // margin

  // ── HEADER BAND ──────────────────────────────────────
  page.drawRectangle({ x: 0, y: height - 90, width, height: 90, color: TEAL })

  // Company name
  page.drawText('DUROMAX UPVC', { x: M, y: height - 32, font: fontB, size: 18, color: WHITE })
  page.drawText('Pvt. Ltd.', { x: M, y: height - 48, font: fontR, size: 10, color: rgb(0.7, 0.95, 0.87) })

  // Document title
  page.drawText('TAX INVOICE', { x: width - M - 100, y: height - 35, font: fontB, size: 14, color: WHITE })
  page.drawText(data.invoiceNumber, { x: width - M - 100, y: height - 52, font: fontR, size: 10, color: rgb(0.7, 0.95, 0.87) })

  // Divider
  page.drawLine({ start: { x: M, y: height - 90 }, end: { x: width - M, y: height - 90 }, color: TEAL, thickness: 1 })

  // ── COMPANY + INVOICE DETAILS BAND ───────────────────
  let y = height - 110

  // Left: Company details
  page.drawText(COMPANY.name, { x: M, y, font: fontB, size: 10, color: INK })
  y -= 14
  for (const line of COMPANY.address.split('\n')) {
    page.drawText(line, { x: M, y, font: fontR, size: 9, color: MUTED })
    y -= 12
  }
  page.drawText(`GSTIN: ${COMPANY.gstin}`, { x: M, y, font: fontR, size: 9, color: MUTED }); y -= 12
  page.drawText(`State: ${COMPANY.state} (Code: ${COMPANY.stateCode})`, { x: M, y, font: fontR, size: 9, color: MUTED }); y -= 12
  page.drawText(`Ph: ${COMPANY.phone}  |  ${COMPANY.email}`, { x: M, y, font: fontR, size: 9, color: MUTED })

  // Right: Invoice meta box
  const boxX = width / 2 + 20
  const boxY = height - 108
  page.drawRectangle({ x: boxX, y: boxY - 80, width: width - boxX - M, height: 88, color: TEAL_L, borderColor: BORDER, borderWidth: 0.5 })

  const meta = [
    ['Invoice No.',   data.invoiceNumber],
    ['Invoice Date',  data.invoiceDate],
    ['Ticket No.',    data.ticketNumber],
    ['Place of Supply', `${COMPANY.state} (${COMPANY.stateCode})`],
  ]
  let mY = boxY - 10
  for (const [label, value] of meta) {
    page.drawText(label + ':', { x: boxX + 8, y: mY, font: fontR, size: 8.5, color: MUTED })
    page.drawText(value, { x: boxX + 90, y: mY, font: fontB, size: 8.5, color: INK })
    mY -= 16
  }

  // Status badge
  if (data.paymentStatus === 'paid') {
    page.drawRectangle({ x: boxX + 8, y: mY - 6, width: 60, height: 16, color: GREEN, borderRadius: 4 })
    page.drawText('✓ PAID', { x: boxX + 18, y: mY - 1, font: fontB, size: 9, color: WHITE })
  } else {
    page.drawRectangle({ x: boxX + 8, y: mY - 6, width: 72, height: 16, color: RED, borderRadius: 4 })
    page.drawText('PAYMENT DUE', { x: boxX + 12, y: mY - 1, font: fontB, size: 9, color: WHITE })
  }

  // ── BILL TO ───────────────────────────────────────────
  y = height - 230
  page.drawRectangle({ x: M, y: y - 10, width: (width - 2 * M) / 2 - 10, height: 80, color: TEAL_L, borderColor: BORDER, borderWidth: 0.5 })
  page.drawText('BILL TO', { x: M + 8, y: y + 55, font: fontB, size: 8, color: TEAL })
  page.drawText(data.clientName, { x: M + 8, y: y + 40, font: fontB, size: 10, color: INK })
  // Word-wrap address
  const addrWords = data.clientAddress.split(' ')
  let addrLine = '', addrY = y + 26
  for (const word of addrWords) {
    if ((addrLine + word).length > 48) {
      page.drawText(addrLine.trim(), { x: M + 8, y: addrY, font: fontR, size: 8.5, color: MUTED }); addrY -= 11; addrLine = ''
    }
    addrLine += word + ' '
  }
  if (addrLine.trim()) page.drawText(addrLine.trim(), { x: M + 8, y: addrY, font: fontR, size: 8.5, color: MUTED })
  page.drawText(`Ph: ${data.clientMobile}`, { x: M + 8, y: y - 4, font: fontR, size: 8.5, color: MUTED })
  if (data.clientGstin) {
    page.drawText(`GSTIN: ${data.clientGstin}`, { x: M + 8, y: y - 16, font: fontR, size: 8.5, color: MUTED })
  }

  // ── ITEMS TABLE ───────────────────────────────────────
  y = height - 330
  const cols = [M, M+30, M+220, M+270, M+310, M+360, M+410, M+460]
  const colW = width - M - 40

  // Table header
  page.drawRectangle({ x: M, y: y - 2, width: colW, height: 20, color: TEAL })
  const headers = ['#', 'Description', 'SAC', 'Qty', 'Unit', 'Rate', 'Taxable', 'Amount']
  const hX      = [M+4, M+24, M+216, M+264, M+304, M+354, M+400, M+452]
  for (let i = 0; i < headers.length; i++) {
    page.drawText(headers[i], { x: hX[i], y: y + 3, font: fontB, size: 8, color: WHITE })
  }
  y -= 22

  // Calculate subtotal and GST
  let subtotal = 0
  let sNo = 1

  for (const item of data.items) {
    const lineTotal = item.qty * item.rate
    subtotal += lineTotal
    const bg = sNo % 2 === 0 ? rgb(0.97, 0.97, 0.97) : WHITE
    page.drawRectangle({ x: M, y: y - 4, width: colW, height: 18, color: bg })

    // Word wrap description
    const descMax = 30
    const descLine1 = item.description.substring(0, descMax)
    const descLine2 = item.description.length > descMax ? item.description.substring(descMax, 60) : ''

    page.drawText(String(sNo),             { x: hX[0], y: y + 2, font: fontR, size: 8, color: INK })
    page.drawText(descLine1,               { x: hX[1], y: descLine2 ? y + 6 : y + 2, font: descLine2 ? fontB : fontR, size: 8, color: INK })
    if (descLine2) page.drawText(descLine2, { x: hX[1], y: y - 2, font: fontR, size: 7.5, color: MUTED })
    page.drawText(item.hsn,                { x: hX[2], y: y + 2, font: fontR, size: 8, color: MUTED })
    page.drawText(String(item.qty),        { x: hX[3], y: y + 2, font: fontR, size: 8, color: INK })
    page.drawText(item.unit,               { x: hX[4], y: y + 2, font: fontR, size: 8, color: INK })
    page.drawText(formatCurrency(item.rate),  { x: hX[5], y: y + 2, font: fontR, size: 8, color: INK })
    page.drawText(formatCurrency(lineTotal),  { x: hX[6], y: y + 2, font: fontR, size: 8, color: INK })
    page.drawText(formatCurrency(lineTotal),  { x: hX[7], y: y + 2, font: fontB, size: 8, color: INK })
    y -= 20; sNo++
  }

  // ── TAX SUMMARY ───────────────────────────────────────
  y -= 8
  page.drawLine({ start:{x:M,y}, end:{x:width-M,y}, color: BORDER, thickness: 0.5 })
  y -= 16

  // Both supply and billing in Delhi → CGST + SGST (intra-state)
  const cgst = Math.round(subtotal * 0.09 * 100) / 100
  const sgst = Math.round(subtotal * 0.09 * 100) / 100
  const grandTotal = subtotal + cgst + sgst

  const taxRX = width - M - 10  // right-aligned x reference
  const taxLX = width - M - 130  // label x

  const rows = [
    ['Taxable Amount',          formatCurrency(subtotal), INK],
    [`CGST @ 9% (SAC ${COMPANY.sac})`, formatCurrency(cgst),    MUTED],
    [`SGST @ 9% (SAC ${COMPANY.sac})`, formatCurrency(sgst),    MUTED],
  ]
  for (const [label, val, col] of rows) {
    page.drawText(label as string, { x: taxLX, y, font: fontR, size: 9, color: col as ReturnType<typeof rgb> })
    page.drawText(val as string,   { x: taxRX - (val as string).length * 5.5, y, font: fontR, size: 9, color: col as ReturnType<typeof rgb> })
    y -= 14
  }

  // Grand total box
  page.drawRectangle({ x: taxLX - 5, y: y - 6, width: width - taxLX - M + 5, height: 24, color: TEAL })
  page.drawText('GRAND TOTAL', { x: taxLX, y: y + 4, font: fontB, size: 10, color: WHITE })
  const gtStr = formatCurrency(grandTotal)
  page.drawText(gtStr, { x: taxRX - gtStr.length * 6.2, y: y + 4, font: fontB, size: 11, color: WHITE })
  y -= 30

  // ── AMOUNT IN WORDS ───────────────────────────────────
  const words = amountToWords(Math.round(grandTotal))
  page.drawText(`Amount in Words: ${words} only`, { x: M, y, font: fontO, size: 9, color: MUTED })
  y -= 20

  // ── PAYMENT INFO (if paid) ────────────────────────────
  if (data.paymentStatus === 'paid' && data.transactionId) {
    page.drawRectangle({ x: M, y: y - 32, width: colW, height: 40, color: rgb(0.94, 0.99, 0.96), borderColor: GREEN, borderWidth: 0.5 })
    page.drawText('✓ PAYMENT RECEIVED', { x: M + 10, y: y - 8, font: fontB, size: 9, color: GREEN })
    page.drawText(`Transaction ID: ${data.transactionId}   |   Date: ${data.paymentDate}   |   Mode: ${data.paymentMode}`, { x: M + 10, y: y - 22, font: fontR, size: 8.5, color: MUTED })
    y -= 48
  }

  // ── TERMS ─────────────────────────────────────────────
  y -= 10
  page.drawLine({ start:{x:M,y}, end:{x:width-M,y}, color: BORDER, thickness: 0.5 })
  y -= 14
  page.drawText('Terms & Conditions', { x: M, y, font: fontB, size: 9, color: INK }); y -= 12
  const terms = [
    '1. This invoice is computer generated and is valid without signature.',
    '2. Payment is due within 48 hours of invoice date unless otherwise agreed.',
    `3. Goods/services are subject to ${COMPANY.state} jurisdiction.`,
    '4. For disputes, contact service@duromax.in within 7 days of invoice date.',
    `5. SAC Code ${COMPANY.sac} — Maintenance and repair services of fabricated metal products, machinery and equipment.`,
  ]
  for (const term of terms) {
    page.drawText(term, { x: M, y, font: fontR, size: 7.5, color: MUTED }); y -= 10
  }

  // ── FOOTER ────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width, height: 30, color: TEAL })
  page.drawText(`${COMPANY.name}  |  GSTIN: ${COMPANY.gstin}  |  ${COMPANY.phone}  |  ${COMPANY.email}`, {
    x: M, y: 10, font: fontR, size: 8, color: rgb(0.7, 0.95, 0.87)
  })

  return await doc.save()
}

// ── Invoice number generator ─────────────────────────
let invoiceCounter = 1000
export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear()
  invoiceCounter++
  return `INV-${year}-${String(invoiceCounter).padStart(4, '0')}`
}

// ── Amount to words (simplified Indian number system) ─
function amountToWords(amount: number): string {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
                 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
                 'Seventeen', 'Eighteen', 'Nineteen']
  const tens  = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function words(n: number): string {
    if (n === 0) return ''
    if (n < 20) return units[n]
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' ' + units[n%10] : '')
    if (n < 1000) return units[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' ' + words(n%100) : '')
    if (n < 100000) return words(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' ' + words(n%1000) : '')
    if (n < 10000000) return words(Math.floor(n/100000)) + ' Lakh' + (n%100000 ? ' ' + words(n%100000) : '')
    return words(Math.floor(n/10000000)) + ' Crore' + (n%10000000 ? ' ' + words(n%10000000) : '')
  }

  return 'Rupees ' + (words(amount) || 'Zero')
}
