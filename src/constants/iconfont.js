// 提取 iconfont 图标
function extractIconFromRule(rule) {
  if (!(rule instanceof CSSStyleRule)) return null

  const { selectorText, style } = rule
  if (!selectorText?.startsWith('.iconsys-') || !selectorText.includes('::before')) return null

  const className = selectorText.substring(1).replace('::before', '')
  const content = style.getPropertyValue('content')
  if (!content) return null

  const unicode = content.replace(/['"\\]/g, '')
  return {
    className,
    unicode: unicode ? `&#x${getUnicode(unicode)};` : undefined
  }
}

const processedErrors = new Set()

export function extractIconClasses() {
  const iconInfos = []

  try {
    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        const rules = Array.from(sheet.cssRules || sheet.rules)
        rules.forEach((rule) => {
          const iconInfo = extractIconFromRule(rule)
          if (iconInfo) {
            iconInfos.push(iconInfo)
          }
        })
      } catch (error) {
        const styleSheetError = { sheet, error }
        if (!processedErrors.has(styleSheetError)) {
          console.warn('Cannot read cssRules from stylesheet:', {
            error,
            sheetHref: sheet.href
          })
          processedErrors.add(styleSheetError)
        }
      }
    })
  } catch (error) {
    console.error('Failed to process stylesheets:', error)
  }

  return iconInfos
}

export function getUnicode(charCode) {
  if (!charCode) return ''
  return charCode.charCodeAt(0).toString(16).padStart(4, '0')
}
