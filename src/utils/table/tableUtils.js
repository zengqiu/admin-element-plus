// 表格工具函数

// 辅助函数：从对象中提取记录数组
function extractRecords(obj, fields) {
  for (const field of fields) {
    if (field in obj && Array.isArray(obj[field])) {
      return obj[field]
    }
  }
  return []
}

// 辅助函数：从对象中提取总数
function extractTotal(obj, records, fields) {
  for (const field of fields) {
    if (field in obj && typeof obj[field] === 'number') {
      return obj[field]
    }
  }
  return records.length
}

// 辅助函数：提取分页参数
function extractPagination(
  obj,
  data
) {
  const result = {}
  const sources = [obj, data ?? {}]

  const currentFields = ['current', 'page', 'pageNum']
  for (const src of sources) {
    for (const field of currentFields) {
      if (field in src && typeof src[field] === 'number') {
        result.current = src[field]
        break
      }
    }
    if (result.current !== undefined) break
  }

  const sizeFields = ['size', 'pageSize', 'limit']
  for (const src of sources) {
    for (const field of sizeFields) {
      if (field in src && typeof src[field] === 'number') {
        result.size = src[field]
        break
      }
    }
    if (result.size !== undefined) break
  }

  if (result.current === undefined && result.size === undefined) return undefined
  return result
}

/**
 * 默认响应适配器 - 支持多种常见的API响应格式
 */
export const defaultResponseAdapter = (response) => {
  if (!response) {
    return { records: [], total: 0 }
  }

  if (Array.isArray(response)) {
    return { records: response, total: response.length }
  }

  if (typeof response !== 'object') {
    console.warn('[tableUtils] 无法识别的响应格式:', response)
    return { records: [], total: 0 }
  }

  const res = response
  let records = []
  let total = 0
  let pagination

  // 处理标准格式或直接列表
  const recordFields = ['records', 'data', 'list', 'items', 'result']
  records = extractRecords(res, recordFields)
  total = extractTotal(res, records, ['total', 'count'])
  pagination = extractPagination(res)

  // 如果没有找到，检查嵌套data
  if (records.length === 0 && 'data' in res && typeof res.data === 'object') {
    const data = res.data
    records = extractRecords(data, ['list', 'records', 'items'])
    total = extractTotal(data, records, ['total', 'count'])
    pagination = extractPagination(res, data)

    if (Array.isArray(res.data)) {
      records = res.data
      total = records.length
    }
  }

  // 如果还是没有找到，使用兜底
  if (records.length === 0) {
    console.warn('[tableUtils] 无法识别的响应格式:', response)
  }

  const result = { records, total }
  if (pagination) {
    Object.assign(result, pagination)
  }
  return result
}

/**
 * 从标准化的API响应中提取表格数据
 */
export const extractTableData = (response) => {
  const data = response.records || response.data || []
  return Array.isArray(data) ? data : []
}

/**
 * 根据API响应更新分页信息
 */
export const updatePaginationFromResponse = (
  pagination,
  response
) => {
  pagination.total = response.total ?? pagination.total ?? 0

  if (response.current !== undefined) {
    pagination.current = response.current
  }

  if (response.size !== undefined) {
    pagination.size = response.size
  }

  const maxPage = Math.max(1, Math.ceil(pagination.total / (pagination.size || 1)))
  if (pagination.current > maxPage) {
    pagination.current = maxPage
  }
}

/**
 * 创建智能防抖函数 - 支持取消和立即执行
 */
export const createSmartDebounce = (fn, delay) => {
  let timeoutId = null
  let lastArgs = null
  let lastResolve = null
  let lastReject = null

  const debouncedFn = (...args) => {
    return new Promise((resolve, reject) => {
      if (timeoutId) clearTimeout(timeoutId)
      lastArgs = args
      lastResolve = resolve
      lastReject = reject
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args)
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          timeoutId = null
          lastArgs = null
          lastResolve = null
          lastReject = null
        }
      }, delay)
    })
  }

  debouncedFn.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = null
    lastArgs = null
    lastResolve = null
    lastReject = null
  }

  debouncedFn.flush = async () => {
    if (timeoutId && lastArgs && lastResolve && lastReject) {
      clearTimeout(timeoutId)
      timeoutId = null
      const args = lastArgs
      const resolve = lastResolve
      const reject = lastReject
      lastArgs = null
      lastResolve = null
      lastReject = null
      try {
        const result = await fn(...args)
        resolve(result)
        return result
      } catch (error) {
        reject(error)
        throw error
      }
    }
    return Promise.resolve()
  }

  return debouncedFn
}

/**
 * 生成错误处理函数
 */
export const createErrorHandler = (
  onError,
  enableLog = false
) => {
  const logger = {
    error: (message, ...args) => {
      if (enableLog) console.error(`[useTable] ${message}`, ...args)
    }
  }

  return (err, context) => {
    const tableError = {
      code: 'UNKNOWN_ERROR',
      message: '未知错误',
      details: err
    }

    if (err instanceof Error) {
      tableError.message = err.message
      tableError.code = err.name
    } else if (typeof err === 'string') {
      tableError.message = err
    }

    logger.error(`${context}:`, err)
    onError?.(tableError)
    return tableError
  }
}
