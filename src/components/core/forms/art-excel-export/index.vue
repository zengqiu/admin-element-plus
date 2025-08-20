<!-- 导出 Excel 文件 -->
<template>
  <ElButton
    :type="type"
    :size="size"
    :loading="isExporting"
    :disabled="disabled || !hasData"
    v-ripple
    @click="handleExport"
  >
    <template #loading>
      <ElIcon class="is-loading">
        <Loading />
      </ElIcon>
      {{ loadingText }}
    </template>
    <slot>{{ buttonText }}</slot>
  </ElButton>
</template>

<script setup>
  import * as XLSX from 'xlsx'
  import FileSaver from 'file-saver'
  import { ref, computed, nextTick } from 'vue'
  import { ElMessage } from 'element-plus'
  import { Loading } from '@element-plus/icons-vue'
  import { useThrottleFn } from '@vueuse/core'

  defineOptions({ name: 'ArtExcelExport' })

  const props = defineProps({
    /** 数据源 */
    data: {
      type: Array,  // [{string: string | number | boolean | null | undefined | Date}]
      required: true
    },
    /** 文件名（不含扩展名） */
    filename: {
      type: String,
      default: () => `export_${new Date().toISOString().slice(0, 10)}`
    },
    /** 工作表名称 */
    sheetName: {
      type: String,
      default: 'Sheet1'
    },
    /** 按钮类型 */
    type: {
      type: String, // 假设 ButtonType 是字符串类型
      default: 'primary',
      validator: (value) => {
        const validTypes = [
          'primary',
          'success',
          'warning',
          'danger',
          'info',
          'text',
          '' // 空字符串代表默认按钮
        ]
        return validTypes.includes(value)
      }
    },
    /** 按钮尺寸 */
    size: {
      type: String,
      default: 'default',
      validator: (value) => ['large', 'default', 'small'].includes(value)
    },
    /** 是否禁用 */
    disabled: {
      type: Boolean,
      default: false
    },
    /** 按钮文本 */
    buttonText: {
      type: String,
      default: '导出 Excel'
    },
    /** 加载中文本 */
    loadingText: {
      type: String,
      default: '导出中...'
    },
    /** 是否自动添加序号列 */
    autoIndex: {
      type: Boolean,
      default: false
    },
    /** 序号列标题 */
    indexColumnTitle: {
      type: String,
      default: '序号'
    },
    /** 列配置映射 */
    columns: {
      type: Object,  // {string: {title列标题: string, width列宽度?: number, formatter数据格式化函数?: (value: ExportValue, row: ExportData, index: number) => string}}
      default: () => ({})
    },
    /** 表头映射（简化版本，向后兼容） */
    headers: {
      type: Object,  // {string: string}
      default: () => ({})
    },
    /** 最大导出行数 */
    maxRows: {
      type: Number,
      default: 100000
    },
    /** 是否显示成功消息 */
    showSuccessMessage: {
      type: Boolean,
      default: true
    },
    /** 是否显示错误消息 */
    showErrorMessage: {
      type: Boolean,
      default: true
    },
    /** 工作簿配置 */
    workbookOptions: {
      type: Object,  // {creator创建者?: string, lastModifiedBy最后修改者?: string, created创建时间?: Date, modified修改时间?: Date}
      default: () => ({})
    }
  })

  const emit = defineEmits([
    'before-export',
    'export-success',
    'export-error',
    'export-progress'
  ])

  /** 导出错误类型 */
  class ExportError extends Error {
    constructor(
      message,
      code,
      details
    ) {
      super(message)
      this.name = 'ExportError'
    }
  }

  const isExporting = ref(false)

  /** 是否有数据可导出 */
  const hasData = computed(() => Array.isArray(props.data) && props.data.length > 0)

  /** 验证导出数据 */
  const validateData = (data) => {
    if (!Array.isArray(data)) {
      throw new ExportError('数据必须是数组格式', 'INVALID_DATA_TYPE')
    }

    if (data.length === 0) {
      throw new ExportError('没有可导出的数据', 'NO_DATA')
    }

    if (data.length > props.maxRows) {
      throw new ExportError(`数据行数超过限制（${props.maxRows}行）`, 'EXCEED_MAX_ROWS', {
        currentRows: data.length,
        maxRows: props.maxRows
      })
    }
  }

  /** 格式化单元格值 */
  const formatCellValue = (
    value,
    key,
    row,
    index
  ) => {
    // 使用列配置的格式化函数
    const column = props.columns[key]
    if (column?.formatter) {
      return column.formatter(value, row, index)
    }

    // 处理特殊值
    if (value === null || value === undefined) {
      return ''
    }

    if (value instanceof Date) {
      return value.toLocaleDateString('zh-CN')
    }

    if (typeof value === 'boolean') {
      return value ? '是' : '否'
    }

    return String(value)
  }

  /** 处理数据 */
  const processData = (data) => {
    const processedData = data.map((item, index) => {
      const processedItem = {}

      // 添加序号列
      if (props.autoIndex) {
        processedItem[props.indexColumnTitle] = String(index + 1)
      }

      // 处理数据列
      Object.entries(item).forEach(([key, value]) => {
        // 获取列标题
        let columnTitle = key
        if (props.columns[key]?.title) {
          columnTitle = props.columns[key].title
        } else if (props.headers[key]) {
          columnTitle = props.headers[key]
        }

        // 格式化值
        processedItem[columnTitle] = formatCellValue(value, key, item, index)
      })

      return processedItem
    })

    return processedData
  }

  /** 计算列宽度 */
  const calculateColumnWidths = (data) => {
    if (data.length === 0) return []

    const sampleSize = Math.min(data.length, 100) // 只取前100行计算列宽
    const columns = Object.keys(data[0])

    return columns.map((column) => {
      // 使用配置的列宽度
      const configWidth = Object.values(props.columns).find((col) => col.title === column)?.width

      if (configWidth) {
        return { wch: configWidth }
      }

      // 自动计算列宽度
      const maxLength = Math.max(
        column.length, // 标题长度
        ...data.slice(0, sampleSize).map((row) => String(row[column] || '').length)
      )

      // 限制最小和最大宽度
      const width = Math.min(Math.max(maxLength + 2, 8), 50)
      return { wch: width }
    })
  }

  /** 导出到 Excel */
  const exportToExcel = async (
    data,
    filename,
    sheetName
  ) => {
    try {
      emit('export-progress', 10)

      // 处理数据
      const processedData = processData(data)
      emit('export-progress', 30)

      // 创建工作簿
      const workbook = XLSX.utils.book_new()

      // 设置工作簿属性
      if (props.workbookOptions) {
        workbook.Props = {
          Title: filename,
          Subject: '数据导出',
          Author: props.workbookOptions.creator || 'Art Design Pro',
          Manager: props.workbookOptions.lastModifiedBy || '',
          Company: '系统导出',
          Category: '数据',
          Keywords: 'excel,export,data',
          Comments: '由系统自动生成',
          CreatedDate: props.workbookOptions.created || new Date(),
          ModifiedDate: props.workbookOptions.modified || new Date()
        }
      }

      emit('export-progress', 50)

      // 创建工作表
      const worksheet = XLSX.utils.json_to_sheet(processedData)

      // 设置列宽度
      worksheet['!cols'] = calculateColumnWidths(processedData)

      emit('export-progress', 70)

      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

      emit('export-progress', 85)

      // 生成 Excel 文件
      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
        compression: true
      })

      // 创建 Blob 并下载
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      emit('export-progress', 95)

      // 使用时间戳确保文件名唯一
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const finalFilename = `${filename}_${timestamp}.xlsx`

      FileSaver.saveAs(blob, finalFilename)

      emit('export-progress', 100)

      // 等待下载开始
      await nextTick()

      return Promise.resolve()
    } catch (error) {
      throw new ExportError(`Excel 导出失败: ${(error).message}`, 'EXPORT_FAILED', error)
    }
  }

  /** 处理导出 */
  const handleExport = useThrottleFn(async () => {
    if (isExporting.value) return

    isExporting.value = true

    try {
      // 验证数据
      validateData(props.data)

      // 触发导出前事件
      emit('before-export', props.data)

      // 执行导出
      await exportToExcel(props.data, props.filename, props.sheetName)

      // 触发成功事件
      emit('export-success', props.filename, props.data.length)

      // 显示成功消息
      if (props.showSuccessMessage) {
        ElMessage.success({
          message: `成功导出 ${props.data.length} 条数据`,
          duration: 3000
        })
      }
    } catch (error) {
      const exportError =
        error instanceof ExportError
          ? error
          : new ExportError(`导出失败: ${(error).message}`, 'UNKNOWN_ERROR', error)

      // 触发错误事件
      emit('export-error', exportError)

      // 显示错误消息
      if (props.showErrorMessage) {
        ElMessage.error({
          message: exportError.message,
          duration: 5000
        })
      }

      console.error('Excel 导出错误:', exportError)
    } finally {
      isExporting.value = false
      emit('export-progress', 0)
    }
  }, 1000)

  // 暴露方法供父组件调用
  defineExpose({
    exportData: handleExport,
    isExporting: readonly(isExporting),
    hasData
  })
</script>

<style scoped>
  .is-loading {
    animation: rotating 2s linear infinite;
  }

  @keyframes rotating {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
</style>
