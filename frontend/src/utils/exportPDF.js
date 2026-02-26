// ─────────────────────────────────────────────────────────────────────────────
// exportPDF.js  —  Cortex PDF Export  (uses jsPDF, no backend needed)
// Install:  npm install jspdf
// Usage:    import { exportToPDF } from '../utils/exportPDF'
//           exportToPDF(items, userName)
// ─────────────────────────────────────────────────────────────────────────────
import { jsPDF } from 'jspdf'

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  darkBg:    [10,  10,  15],
  cardBg:    [15,  15,  26],
  cardBorder:[26,  26,  46],
  purple:    [124, 58,  237],
  purpleL:   [167, 139, 250],
  pink:      [236, 72,  153],
  white:     [255, 255, 255],
  gray4:     [156, 163, 175],
  gray6:     [75,  85,  99],
  gray8:     [31,  41,  55],
  green:     [52,  211, 153],
  blue:      [96,  165, 250],
  yellow:    [251, 191, 36],
  red:       [248, 113, 113],
}

const CATEGORY_COLORS = {
  tech:    C.blue,
  health:  C.green,
  finance: C.yellow,
  travel:  [244, 114, 182],
  other:   C.purpleL,
}

const SOURCE_LABELS = {
  youtube:   'YouTube',
  instagram: 'Instagram',
  twitter:   'Twitter',
  whatsapp:  'WhatsApp',
  link:      'Link',
  note:      'Note',
  text:      'Note',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const rgb  = (arr) => ({ r: arr[0], g: arr[1], b: arr[2] })
const hex3 = (arr) => `#${arr.map(v => v.toString(16).padStart(2,'0')).join('')}`

function setFill(doc, col)   { doc.setFillColor(...col) }
function setStroke(doc, col) { doc.setDrawColor(...col) }
function setTextColor(doc, col) { doc.setTextColor(...col) }

function wrapText(doc, text, maxWidth, fontSize) {
  doc.setFontSize(fontSize)
  return doc.splitTextToSize(text, maxWidth)
}

function pill(doc, x, y, w, h, r, fillCol, alpha = 1) {
  doc.saveGraphicsState()
  doc.setGState(new doc.GState({ opacity: alpha }))
  setFill(doc, fillCol)
  doc.roundedRect(x, y, w, h, r, r, 'F')
  doc.restoreGraphicsState()
}

function pillText(doc, text, x, y, fontSize, textCol, bgCol, bgAlpha = 0.15) {
  doc.setFontSize(fontSize)
  const tw = doc.getTextWidth(text)
  const pw = tw + 5, ph = fontSize * 0.55 + 2
  pill(doc, x, y - ph + 1, pw, ph, 2, bgCol, bgAlpha)
  setTextColor(doc, textCol)
  doc.text(text, x + 2.5, y)
  return pw + 3
}

function timeAgo(dateStr) {
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const days = Math.floor((now - d) / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7)  return `${days}d ago`
    if (days < 30) return `${Math.floor(days/7)}w ago`
    return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
  } catch { return '' }
}

// ── Page background + grid ────────────────────────────────────────────────────
function drawBackground(doc, W, H) {
  setFill(doc, C.darkBg)
  doc.rect(0, 0, W, H, 'F')

  // Subtle dot grid
  doc.saveGraphicsState()
  doc.setGState(new doc.GState({ opacity: 0.07 }))
  setFill(doc, [255, 255, 255])
  for (let x = 8; x < W; x += 12) {
    for (let y = 8; y < H; y += 12) {
      doc.circle(x, y, 0.4, 'F')
    }
  }
  doc.restoreGraphicsState()

  // Glow top-left
  doc.saveGraphicsState()
  doc.setGState(new doc.GState({ opacity: 0.07 }))
  setFill(doc, C.purple)
  doc.ellipse(30, 30, 60, 60, 'F')
  doc.restoreGraphicsState()
}

// ── Header ────────────────────────────────────────────────────────────────────
function drawHeader(doc, W, totalItems, userName) {
  // Header card
  setFill(doc, [13, 13, 24])
  doc.roundedRect(8, 8, W - 16, 28, 3, 3, 'F')

  // Purple left accent
  setFill(doc, C.purple)
  doc.roundedRect(8, 8, 2.5, 28, 1, 1, 'F')

  // Logo
  setTextColor(doc, C.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('cortex', 14, 20)
  const logoW = doc.getTextWidth('cortex')
  setTextColor(doc, C.purpleL)
  doc.text('.', 14 + logoW, 20)

  // Tagline
  setTextColor(doc, C.gray6)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.text('Your AI Second Brain — Knowledge Export', 14, 28)

  // Right side stats
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  setTextColor(doc, C.purpleL)
  const countW = doc.getTextWidth(String(totalItems))
  doc.text(String(totalItems), W - 10 - countW, 19)
  setTextColor(doc, C.gray6)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.5)
  doc.text('ideas', W - 10 - doc.getTextWidth('ideas'), 25)

  // Date
  doc.setFontSize(6.5)
  setTextColor(doc, C.gray4)
  doc.setFont('helvetica', 'normal')
  const dw = doc.getTextWidth(dateStr)
  doc.text(dateStr, W - 15 - countW - 4 - dw, 22)

  // Purple line separator
  for (let i = 0; i < 100; i++) {
    const t = i / 100
    const r = Math.round(124 + (236 - 124) * t)
    const g = Math.round(58  + (72  - 58)  * t)
    const b = Math.round(237 + (153 - 237) * t)
    doc.setDrawColor(r, g, b)
    doc.setLineWidth(0.4)
    const lx = 8 + (W - 16) * (i / 100)
    doc.line(lx, 36, lx + (W - 16) / 100 + 0.5, 36)
  }

  // User greeting
  if (userName) {
    setTextColor(doc, C.gray6)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(6)
    doc.text(`Exported for ${userName}`, 14, 33)
  }
}

// ── Footer ────────────────────────────────────────────────────────────────────
function drawFooter(doc, W, H, pageNum, totalPages) {
  setFill(doc, [11, 11, 20])
  doc.rect(0, H - 10, W, 10, 'F')

  setTextColor(doc, C.gray6)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.5)
  doc.text('cortex. — AI Second Brain', 8, H - 3.5)
  doc.text(`Page ${pageNum} of ${totalPages}`, W - 8 - doc.getTextWidth(`Page ${pageNum} of ${totalPages}`), H - 3.5)

  // Footer gradient line
  for (let i = 0; i < 80; i++) {
    const t = i / 80
    const r = Math.round(124 + (236 - 124) * t)
    const g = Math.round(58  + (72  - 58)  * t)
    const b = Math.round(237 + (153 - 237) * t)
    doc.setDrawColor(r, g, b)
    doc.setLineWidth(0.3)
    const lx = 8 + (W - 16) * (i / 80)
    doc.line(lx, H - 10, lx + (W - 16) / 80 + 0.5, H - 10)
  }
}

// ── Item Card ─────────────────────────────────────────────────────────────────
function drawCard(doc, item, x, y, cw, ch) {
  const cat      = (item.category || 'other').toLowerCase()
  const catColor = CATEGORY_COLORS[cat] || CATEGORY_COLORS.other
  const source   = SOURCE_LABELS[item.source_type] || 'Note'
  const pinned   = item.pinned || false

  // Card background
  setFill(doc, C.cardBg)
  doc.roundedRect(x, y, cw, ch, 3, 3, 'F')

  // Card border
  doc.saveGraphicsState()
  doc.setGState(new doc.GState({ opacity: 0.5 }))
  setStroke(doc, C.cardBorder)
  doc.setLineWidth(0.3)
  doc.roundedRect(x, y, cw, ch, 3, 3, 'S')
  doc.restoreGraphicsState()

  // Left accent bar
  setFill(doc, catColor)
  doc.roundedRect(x, y, 2, ch, 1.5, 1.5, 'F')

  const ix  = x + 5   // inner x
  const iw  = cw - 10  // inner width
  let cy = y + 6       // current y

  // ── Category + Source badges ──────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(5)
  let bx = ix

  // Category
  const catLabel = cat.charAt(0).toUpperCase() + cat.slice(1)
  const catW = doc.getTextWidth(catLabel) + 5
  pill(doc, bx, cy - 4, catW, 5.5, 1.5, catColor, 0.18)
  setTextColor(doc, catColor)
  doc.text(catLabel, bx + 2.5, cy)
  bx += catW + 3

  // Source
  doc.setFont('helvetica', 'normal')
  const srcW = doc.getTextWidth(source) + 5
  pill(doc, bx, cy - 4, srcW, 5.5, 1.5, C.gray8, 1)
  setTextColor(doc, C.gray4)
  doc.text(source, bx + 2.5, cy)
  bx += srcW + 3

  // Pinned
  if (pinned) {
    const pinW = doc.getTextWidth('Pinned') + 5
    pill(doc, bx, cy - 4, pinW, 5.5, 1.5, [146, 64, 14], 0.35)
    setTextColor(doc, C.yellow)
    doc.text('Pinned', bx + 2.5, cy)
  }

  cy += 5.5

  // ── Title ────────────────────────────────────────────────────────────────
  setTextColor(doc, C.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  const titleLines = doc.splitTextToSize(item.title || 'Untitled', iw)
  const titleShow  = titleLines.slice(0, 2)
  if (titleLines.length > 2) titleShow[1] = titleShow[1].replace(/\.?\s*$/, '...')
  doc.text(titleShow, ix, cy)
  cy += titleShow.length * 4.5 + 1.5

  // ── Summary ───────────────────────────────────────────────────────────────
  if (item.summary) {
    setTextColor(doc, C.gray4)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    const sumLines = doc.splitTextToSize(item.summary, iw).slice(0, 3)
    if (item.summary.split(' ').length > sumLines.join(' ').split(' ').length)
      sumLines[sumLines.length - 1] = sumLines[sumLines.length - 1].replace(/\.?\s*$/, '...')
    doc.text(sumLines, ix, cy)
    cy += sumLines.length * 3.8 + 2
  }

  // ── Thin divider ─────────────────────────────────────────────────────────
  doc.saveGraphicsState()
  doc.setGState(new doc.GState({ opacity: 0.2 }))
  setStroke(doc, [255, 255, 255])
  doc.setLineWidth(0.2)
  doc.line(ix, cy, x + cw - 4, cy)
  doc.restoreGraphicsState()
  cy += 3.5

  // ── Tags ─────────────────────────────────────────────────────────────────
  const tags = (item.tags || []).slice(0, 3)
  let tx = ix
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.5)
  for (const tag of tags) {
    const label = tag.startsWith('#') ? tag : `#${tag}`
    const tw = doc.getTextWidth(label) + 4
    if (tx + tw > x + cw - 4) break
    pill(doc, tx, cy - 3.5, tw, 5, 1.5, C.purple, 0.15)
    setTextColor(doc, C.purpleL)
    doc.text(label, tx + 2, cy)
    tx += tw + 2.5
  }

  // ── Date (right aligned) ──────────────────────────────────────────────────
  const dateStr = timeAgo(item.created_at)
  if (dateStr) {
    setTextColor(doc, C.gray6)
    doc.setFontSize(5.5)
    const dw = doc.getTextWidth(dateStr)
    doc.text(dateStr, x + cw - 4 - dw, cy)
  }
}

// ── Summary Page ──────────────────────────────────────────────────────────────
function drawSummaryPage(doc, items, W, H, userName) {
  drawBackground(doc, W, H)
  drawHeader(doc, W, items.length, userName)

  let sy = 50

  // Section title
  setTextColor(doc, C.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Export Summary', 8, sy)
  sy += 8

  // Stats row
  const cats  = {}
  const srcs  = {}
  let pinnedCount = 0
  for (const item of items) {
    const c = (item.category || 'other').toLowerCase()
    cats[c] = (cats[c] || 0) + 1
    const s = item.source_type || 'note'
    srcs[s] = (srcs[s] || 0) + 1
    if (item.pinned) pinnedCount++
  }

  const statCards = [
    { label: 'Total Ideas',  value: items.length,       color: C.purpleL },
    { label: 'Pinned',       value: pinnedCount,          color: C.yellow  },
    { label: 'Categories',   value: Object.keys(cats).length, color: C.blue },
    { label: 'This Week',    value: items.filter(i => {
        const w = new Date(); w.setDate(w.getDate()-7)
        return new Date(i.created_at) > w
      }).length, color: C.green },
  ]

  const sw = (W - 16 - 9) / 4
  for (let i = 0; i < statCards.length; i++) {
    const sc = statCards[i]
    const sx = 8 + i * (sw + 3)
    setFill(doc, C.cardBg)
    doc.roundedRect(sx, sy, sw, 22, 2, 2, 'F')
    setFill(doc, sc.color)
    doc.roundedRect(sx, sy, sw, 1.5, 1, 1, 'F')  // top accent bar
    setTextColor(doc, sc.color)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text(String(sc.value), sx + 4, sy + 13)
    setTextColor(doc, C.gray6)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    doc.text(sc.label, sx + 4, sy + 19)
  }
  sy += 28

  // Category breakdown
  setTextColor(doc, C.gray4)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text('BY CATEGORY', 8, sy)
  sy += 5

  const catEntries = Object.entries(cats).sort((a,b) => b[1]-a[1])
  for (const [cat, count] of catEntries) {
    const color = CATEGORY_COLORS[cat] || CATEGORY_COLORS.other
    const barW  = (count / items.length) * (W - 60)
    // Row
    setTextColor(doc, color)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.text(cat.charAt(0).toUpperCase() + cat.slice(1), 8, sy)
    // Bar
    pill(doc, 38, sy - 4.5, barW, 5, 2, color, 0.25)
    setFill(doc, color)
    doc.roundedRect(38, sy - 4.5, Math.max(barW * 0.6, 3), 5, 2, 2, 'F')
    // Count
    setTextColor(doc, C.gray4)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.text(String(count), 38 + barW + 3, sy)
    sy += 8
  }
  sy += 4

  // Source breakdown
  setTextColor(doc, C.gray4)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text('BY SOURCE', 8, sy)
  sy += 5

  const srcEntries = Object.entries(srcs).sort((a,b) => b[1]-a[1])
  let sx2 = 8
  for (const [src, count] of srcEntries) {
    const label = SOURCE_LABELS[src] || src
    const sw2 = 30
    setFill(doc, C.cardBg)
    doc.roundedRect(sx2, sy, sw2, 14, 2, 2, 'F')
    setTextColor(doc, C.white)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(String(count), sx2 + 4, sy + 8)
    setTextColor(doc, C.gray6)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5.5)
    doc.text(label, sx2 + 4, sy + 12.5)
    sx2 += sw2 + 3
    if (sx2 > W - 40) { sx2 = 8; sy += 18 }
  }
  sy += 20

  // Branding footer
  setTextColor(doc, C.gray8)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  const brandW = doc.getTextWidth('cortex')
  doc.text('cortex', (W - brandW - 4) / 2, H - 30)
  setTextColor(doc, [60, 30, 120])
  doc.text('.', (W - brandW - 4) / 2 + brandW, H - 30)
  setTextColor(doc, C.gray8)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  const tag = 'Your AI Second Brain'
  doc.text(tag, (W - doc.getTextWidth(tag)) / 2, H - 22)

  drawFooter(doc, W, H, '∑', '∑')
}

// ── MAIN EXPORT FUNCTION ──────────────────────────────────────────────────────
export function exportToPDF(items, userName = '') {
  if (!items || items.length === 0) {
    alert('No items to export!')
    return
  }

  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W    = 210   // A4 width mm
  const H    = 297   // A4 height mm

  // Layout
  const MARGIN   = 8
  const TOP      = 42    // below header
  const BOTTOM   = H - 14  // above footer
  const COLS     = 2
  const COL_GAP  = 4
  const CARD_W   = (W - MARGIN * 2 - COL_GAP * (COLS - 1)) / COLS
  const CARD_H   = 52
  const ROW_GAP  = 4
  const PAGE_H   = BOTTOM - TOP
  const ROWS_PP  = Math.floor((PAGE_H + ROW_GAP) / (CARD_H + ROW_GAP))

  const itemsPerPage = COLS * ROWS_PP
  const totalContentPages = Math.ceil(items.length / itemsPerPage)
  const totalPages = totalContentPages + 1  // +1 for summary

  // ── Content pages ──────────────────────────────────────────
  for (let p = 0; p < totalContentPages; p++) {
    if (p > 0) doc.addPage()
    drawBackground(doc, W, H)
    drawHeader(doc, W, items.length, userName)
    drawFooter(doc, W, H, p + 1, totalPages)

    const pageItems = items.slice(p * itemsPerPage, (p + 1) * itemsPerPage)

    pageItems.forEach((item, i) => {
      const col   = i % COLS
      const row   = Math.floor(i / COLS)
      const cx    = MARGIN + col * (CARD_W + COL_GAP)
      const cy    = TOP + row * (CARD_H + ROW_GAP)
      drawCard(doc, item, cx, cy, CARD_W, CARD_H)
    })
  }

  // ── Summary page ───────────────────────────────────────────
  doc.addPage()
  drawSummaryPage(doc, items, W, H, userName)

  // ── Download ───────────────────────────────────────────────
  const fileName = `cortex-export-${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(fileName)
}
