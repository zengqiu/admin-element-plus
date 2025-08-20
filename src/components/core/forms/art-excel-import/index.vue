<!-- 导入 Excel 文件 -->
<template>
  <div class="excel-uploader">
    <ElUpload
      :auto-upload="false"
      accept=".xlsx, .xls"
      :show-file-list="false"
      @change="handleFileChange"
    >
      <ElButton type="primary" v-ripple>
        <slot>导入 Excel</slot>
      </ElButton>
    </ElUpload>
  </div>
</template>

<script setup>
  import * as XLSX from 'xlsx'

  defineOptions({ name: 'ArtExcelImport' })

  // Excel 导入工具函数
  async function importExcel(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          const results = XLSX.utils.sheet_to_json(worksheet)
          resolve(results)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = (error) => reject(error)
      reader.readAsArrayBuffer(file)
    })
  }

  // 定义 emits
  const emit = defineEmits(['import-success', 'import-error'])

  // 处理文件导入
  const handleFileChange = async (uploadFile) => {
    try {
      if (!uploadFile.raw) return
      const results = await importExcel(uploadFile.raw)
      emit('import-success', results)
    } catch (error) {
      emit('import-error', error)
    }
  }
</script>

<style scoped>
  .excel-uploader {
    display: inline-block;
  }
</style>
