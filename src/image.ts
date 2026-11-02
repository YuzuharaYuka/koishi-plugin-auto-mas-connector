import { createCanvas, loadImage } from '@napi-rs/canvas'

/** 渲染选项：只暴露宽度，其余排版值在这里统一维护 */
export interface ImageRenderOptions {
  width?: number
}

type MeasureContext = ReturnType<ReturnType<typeof createCanvas>['getContext']>
type LoadedImage = Awaited<ReturnType<typeof loadImage>>

interface InlineRun {
  text: string
  bold: boolean
  italic: boolean
  code: boolean
}

interface TextBlock {
  kind: 'text'
  block: 'heading' | 'paragraph' | 'listItem'
  level: number
  runs: InlineRun[]
}

interface ImageBlock {
  kind: 'image'
  src: string
}

interface RuleBlock {
  kind: 'rule'
}

type Block = TextBlock | ImageBlock | RuleBlock

interface Unit {
  text: string
  bold: boolean
  italic: boolean
  code: boolean
}

interface Line {
  units: Unit[]
  width: number
}

interface LayoutTextItem {
  kind: 'text'
  lines: Line[]
  size: number
  lineHeight: number
  extraTop: number
  marginBottom: number
  color: string
  indent: number
  bullet: boolean
}

interface LayoutImageItem {
  kind: 'image'
  image: LoadedImage
  width: number
  height: number
  marginBottom: number
}

interface LayoutRuleItem {
  kind: 'rule'
  marginBottom: number
}

type LayoutItem = LayoutTextItem | LayoutImageItem | LayoutRuleItem

const FONT_STACK = '"Microsoft YaHei", "Segoe UI Emoji", "Noto Color Emoji", "PingFang SC", "Noto Sans CJK SC", "Source Han Sans SC", sans-serif'
const PAGE_BACKGROUND = '#ffffff'
const TEXT_COLOR = '#1f2937'
const HEADING_COLOR = '#111827'
const MUTED_COLOR = '#6b7280'
const RULE_COLOR = '#e5e7eb'

const BLOCK_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'li', 'tr', 'blockquote', 'section', 'article'])
const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

/**
 * 把 AUTO-MAS 推送里的 HTML 渲染成一张 PNG。
 * 只处理通知会用到的排版（标题、段落、列表、内嵌图片、分隔线），不追求完整 HTML 语义。
 */
export async function renderNotificationImage(html: string, options: ImageRenderOptions = {}): Promise<Buffer | undefined> {
  const blocks = parseHtml(html)
  if (!blocks.some((block) => block.kind !== 'rule')) return undefined

  const width = clamp(Math.round(options.width ?? 720), 480, 1200)
  const padding = Math.round(width * 0.055)
  const contentWidth = width - padding * 2

  const measure = createCanvas(8, 8).getContext('2d')
  const layout = await layoutBlocks(blocks, contentWidth, measure)
  if (!layout.length) return undefined

  const footerHeight = 48
  const maxBodyHeight = 4096 - footerHeight - padding * 2
  let contentHeight = 0
  for (const item of layout) contentHeight += itemHeight(item) + item.marginBottom

  const bodyHeight = Math.min(contentHeight, maxBodyHeight)
  const height = Math.round(bodyHeight + footerHeight + padding * 2)

  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = PAGE_BACKGROUND
  ctx.fillRect(0, 0, width, height)

  let y = padding
  let truncated = false
  for (const item of layout) {
    const itemHeightValue = itemHeight(item)
    if (y + itemHeightValue > padding + bodyHeight) {
      truncated = true
      break
    }
    drawItem(ctx, item, padding, y)
    y += itemHeightValue + item.marginBottom
  }

  if (truncated) {
    ctx.fillStyle = MUTED_COLOR
    ctx.font = `18px ${FONT_STACK}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText('……内容过长，已截断', padding, padding + bodyHeight - 6)
  }

  const stamp = new Date().toLocaleString('zh-CN', { hour12: false })
  ctx.fillStyle = '#9ca3af'
  ctx.font = `16px ${FONT_STACK}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(`AUTO-MAS · ${stamp}`, padding, height - padding + 6)

  return canvas.toBuffer('image/png')
}

async function layoutBlocks(blocks: Block[], contentWidth: number, measure: MeasureContext): Promise<LayoutItem[]> {
  const layout: LayoutItem[] = []
  for (const block of blocks) {
    if (block.kind === 'rule') {
      layout.push({ kind: 'rule', marginBottom: 22 })
      continue
    }
    if (block.kind === 'image') {
      const image = await decodeDataImage(block.src)
      if (!image) continue
      const ratio = image.height / image.width
      let drawWidth = contentWidth
      let drawHeight = Math.round(drawWidth * ratio)
      if (drawHeight > 640) {
        drawHeight = 640
        drawWidth = Math.round(drawHeight / ratio)
      }
      layout.push({ kind: 'image', image, width: drawWidth, height: drawHeight, marginBottom: 16 })
      continue
    }

    const style = textStyle(block)
    const lines = wrapRuns(block.runs, contentWidth, style.size, style.indent, measure)
    if (!lines.length) continue
    layout.push({
      kind: 'text',
      lines,
      size: style.size,
      lineHeight: Math.round(style.size * style.lineHeightScale),
      extraTop: style.extraTop,
      marginBottom: style.marginBottom,
      color: style.color,
      indent: style.indent,
      bullet: block.block === 'listItem',
    })
  }
  return layout
}

function itemHeight(item: LayoutItem): number {
  if (item.kind === 'rule') return 1
  if (item.kind === 'image') return item.height
  return item.extraTop + item.lines.length * item.lineHeight
}

function textStyle(block: TextBlock): {
  size: number
  color: string
  indent: number
  lineHeightScale: number
  marginBottom: number
  extraTop: number
} {
  if (block.block === 'heading') {
    const size = block.level <= 1 ? 32 : block.level === 2 ? 28 : 25
    return { size, color: HEADING_COLOR, indent: 0, lineHeightScale: 1.45, marginBottom: 14, extraTop: 6 }
  }
  if (block.block === 'listItem') {
    return { size: 23, color: TEXT_COLOR, indent: 18, lineHeightScale: 1.65, marginBottom: 4, extraTop: 0 }
  }
  return { size: 23, color: TEXT_COLOR, indent: 0, lineHeightScale: 1.65, marginBottom: 12, extraTop: 0 }
}

function wrapRuns(runs: InlineRun[], contentWidth: number, size: number, indent: number, measure: MeasureContext): Line[] {
  const units: Unit[] = []
  for (const run of runs) {
    for (const unit of splitUnits(run.text)) units.push({ text: unit, bold: run.bold, italic: run.italic, code: run.code })
  }

  const lines: Line[] = []
  let unitsInLine: Unit[] = []
  let lineWidth = indent
  let pendingSpace = false

  const flush = () => {
    while (unitsInLine.length && unitsInLine[unitsInLine.length - 1].text.trim() === '') unitsInLine.pop()
    if (unitsInLine.length) {
      const width = unitsInLine.reduce((sum, unit) => sum + measureWidth(measure, unit.text, size, unit.bold, unit.italic), 0)
      lines.push({ units: unitsInLine, width })
    }
    unitsInLine = []
    lineWidth = indent
    pendingSpace = false
  }

  for (const unit of units) {
    if (/^\s+$/.test(unit.text)) {
      if (unitsInLine.length) pendingSpace = true
      continue
    }
    const space = pendingSpace ? ' ' : ''
    const text = space + unit.text
    const width = measureWidth(measure, text, size, unit.bold, unit.italic)
    if (unitsInLine.length && lineWidth + width > contentWidth) {
      flush()
      const retry = unit.text
      const retryWidth = measureWidth(measure, retry, size, unit.bold, unit.italic)
      unitsInLine.push({ ...unit, text: retry })
      lineWidth += retryWidth
      pendingSpace = false
      continue
    }
    unitsInLine.push({ ...unit, text })
    lineWidth += width
    pendingSpace = false
  }
  flush()
  return lines
}

function splitUnits(text: string): string[] {
  const units: string[] = []
  const pattern = /[\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef]|\s+|[^\s\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef]+/g
  const matched = text.match(pattern) ?? []
  for (const part of matched) {
    if (/^[^\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef]{32,}$/.test(part)) {
      for (let i = 0; i < part.length; i += 32) units.push(part.slice(i, i + 32))
      continue
    }
    units.push(part)
  }
  return units
}

function measureWidth(measure: MeasureContext, text: string, size: number, bold: boolean, italic: boolean): number {
  measure.font = fontOf(size, bold, italic)
  return measure.measureText(text).width
}

function fontOf(size: number, bold: boolean, italic: boolean): string {
  return `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${size}px ${FONT_STACK}`
}

function drawItem(ctx: MeasureContext, item: LayoutItem, x: number, y: number): void {
  if (item.kind === 'rule') {
    ctx.strokeStyle = RULE_COLOR
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, y + 0.5)
    ctx.lineTo(x + ctx.canvas.width - x * 2, y + 0.5)
    ctx.stroke()
    return
  }
  if (item.kind === 'image') {
    ctx.drawImage(item.image, x, y, item.width, item.height)
    return
  }
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  let lineY = y + item.extraTop
  let first = true
  for (const line of item.lines) {
    lineY += item.lineHeight
    if (first && item.bullet) {
      ctx.fillStyle = item.color
      ctx.beginPath()
      ctx.arc(x + 6, lineY - item.size * 0.32, 2.6, 0, Math.PI * 2)
      ctx.fill()
    }
    first = false
    let cursor = x + item.indent
    for (const unit of line.units) {
      ctx.font = fontOf(item.size, unit.bold, unit.italic)
      ctx.fillStyle = unit.code ? '#b91c1c' : item.color
      ctx.fillText(unit.text, cursor, lineY)
      cursor += ctx.measureText(unit.text).width
    }
  }
}

/** 只解析 <img src="data:..."> 形式的内嵌图片，外链跳过 */
async function decodeDataImage(src: string): Promise<LoadedImage | undefined> {
  const match = /^data:image\/[\w+.-]+;base64,(.+)$/i.exec(src.trim())
  if (!match) return undefined
  try {
    const buffer = Buffer.from(match[1].replace(/\s+/g, ''), 'base64')
    if (!buffer.length) return undefined
    return await loadImage(buffer)
  } catch {
    return undefined
  }
}

function parseHtml(html: string): Block[] {
  const source = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '</p><p>')

  const blocks: Block[] = []
  let runs: InlineRun[] = []
  let kind: TextBlock['block'] = 'paragraph'
  let level = 0
  let boldDepth = 0
  let italicDepth = 0

  const flush = () => {
    const cleaned = trimRuns(runs)
    runs = []
    if (!cleaned.length) return
    blocks.push({ kind: 'text', block: kind, level, runs: cleaned })
  }

  const tokenPattern = /<[^>]+>|[^<]+/g
  let match: RegExpExecArray | null
  while ((match = tokenPattern.exec(source))) {
    const token = match[0]
    if (!token.startsWith('<')) {
      const text = decodeEntities(token)
      if (text) runs.push({ text, bold: boldDepth > 0, italic: italicDepth > 0, code: false })
      continue
    }

    const tagMatch = /^<\/?\s*([a-zA-Z0-9]+)/.exec(token)
    if (!tagMatch) continue
    const name = tagMatch[1].toLowerCase()
    const closing = token.startsWith('</')

    if (name === 'img') {
      const src = /src\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(token)
      const value = src?.[2] ?? src?.[3] ?? src?.[4]
      if (value) {
        flush()
        blocks.push({ kind: 'image', src: value })
      }
      continue
    }

    if (name === 'hr') {
      flush()
      blocks.push({ kind: 'rule' })
      continue
    }

    if (name === 'b' || name === 'strong') {
      boldDepth = Math.max(0, boldDepth + (closing ? -1 : 1))
      continue
    }
    if (name === 'i' || name === 'em') {
      italicDepth = Math.max(0, italicDepth + (closing ? -1 : 1))
      continue
    }
    if (name === 'code' || name === 'kbd') continue

    if (BLOCK_TAGS.has(name)) {
      if (closing) {
        flush()
        kind = 'paragraph'
        level = 0
        continue
      }
      flush()
      if (HEADING_TAGS.has(name)) {
        kind = 'heading'
        level = Number(name[1])
      } else if (name === 'li') {
        kind = 'listItem'
        level = 0
      } else {
        kind = 'paragraph'
        level = 0
      }
    }
  }
  flush()
  return blocks
}

function trimRuns(runs: InlineRun[]): InlineRun[] {
  const result: InlineRun[] = []
  for (const run of runs) {
    const text = run.text.replace(/\s+/g, ' ')
    if (!text) continue
    const previous = result[result.length - 1]
    if (previous && previous.bold === run.bold && previous.italic === run.italic && previous.code === run.code) {
      previous.text += text
      continue
    }
    result.push({ ...run, text })
  }
  while (result.length && result[0].text.startsWith(' ')) result[0].text = result[0].text.replace(/^ +/, '')
  while (result.length && result[result.length - 1].text.endsWith(' ')) {
    result[result.length - 1].text = result[result.length - 1].text.replace(/ +$/, '')
  }
  return result.filter((run) => run.text.length > 0)
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/gi, '&')
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
