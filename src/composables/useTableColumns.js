import { ref, computed, watch } from 'vue'
import { $t } from '@/locales'

/**
 * 特殊列类型
 */
const SPECIAL_COLUMNS = {
  selection: { prop: '__selection__', label: $t('table.column.selection') },
  expand: { prop: '__expand__', label: $t('table.column.expand') },
  index: { prop: '__index__', label: $t('table.column.index') }
}

/**
 * 获取列的唯一标识
 */
export const getColumnKey = (col) => SPECIAL_COLUMNS[col.type]?.prop ?? (col.prop)

/**
 * 获取列的检查状态
 */
export const getColumnChecks = (columns) =>
  columns.map((col) => {
    const special = col.type && SPECIAL_COLUMNS[col.type]
    if (special) {
      return { ...col, prop: special.prop, label: special.label, checked: true }
    }
    return { ...col, checked: col.checked ?? true }
  })

export function useTableColumns(
  columnsFactory
) {
  const dynamicColumns = ref(columnsFactory())
  const columnChecks = ref(getColumnChecks(dynamicColumns.value))

  // 当 dynamicColumns 变动时，重新生成 columnChecks 且保留已存在的 checked 状态
  watch(
    dynamicColumns,
    (newCols) => {
      const checkedMap = new Map(
        columnChecks.value.map((c) => [getColumnKey(c), c.checked ?? true])
      )
      const newChecks = getColumnChecks(newCols).map((c) => ({
        ...c,
        checked: checkedMap.has(getColumnKey(c)) ? checkedMap.get(getColumnKey(c)) : c.checked
      }))
      columnChecks.value = newChecks
    },
    { deep: true }
  )

  // 当前显示列（基于 columnChecks 的 checked）
  const columns = computed(() => {
    const colMap = new Map(dynamicColumns.value.map((c) => [getColumnKey(c), c]))
    return columnChecks.value
      .filter((c) => c.checked)
      .map((c) => colMap.get(getColumnKey(c)))
      .filter(Boolean)
  })

  // 支持 updater 返回新数组或直接在传入数组上 mutate
  const setDynamicColumns = (updater) => {
    const copy = [...dynamicColumns.value]
    const result = updater(copy)
    dynamicColumns.value = Array.isArray(result) ? result : copy
  }

  return {
    columns,
    columnChecks,

    addColumn: (column, index) =>
      setDynamicColumns((cols) => {
        const next = [...cols]
        if (typeof index === 'number' && index >= 0 && index <= next.length) {
          next.splice(index, 0, column)
        } else {
          next.push(column)
        }
        return next
      }),

    removeColumn: (prop) =>
      setDynamicColumns((cols) => cols.filter((c) => getColumnKey(c) !== prop)),

    updateColumn: (prop, updates) =>
      setDynamicColumns((cols) =>
        cols.map((c) => (getColumnKey(c) === prop ? { ...c, ...updates } : c))
      ),

    toggleColumn: (prop, visible) => {
      const i = columnChecks.value.findIndex((c) => getColumnKey(c) === prop)
      if (i > -1) {
        const next = [...columnChecks.value]
        next[i] = { ...next[i], checked: visible ?? !next[i].checked }
        columnChecks.value = next
      }
    },

    resetColumns: () => {
      dynamicColumns.value = columnsFactory()
    },

    batchUpdateColumns: (updates) =>
      setDynamicColumns((cols) => {
        const map = new Map(updates.map((u) => [u.prop, u.updates]))
        return cols.map((c) => {
          const key = getColumnKey(c)
          const upd = map.get(key)
          return upd ? { ...c, ...upd } : c
        })
      }),

    reorderColumns: (fromIndex, toIndex) =>
      setDynamicColumns((cols) => {
        if (
          fromIndex < 0 ||
          fromIndex >= cols.length ||
          toIndex < 0 ||
          toIndex >= cols.length ||
          fromIndex === toIndex
        ) {
          return cols
        }
        const next = [...cols]
        const [moved] = next.splice(fromIndex, 1)
        next.splice(toIndex, 0, moved)
        return next
      }),

    getColumnConfig: (prop) => dynamicColumns.value.find((c) => getColumnKey(c) === prop),

    getAllColumns: () => [...dynamicColumns.value]
  }
}
