<!-- 表格组件 -->
<!-- 支持：el-table 全部属性、事件、插槽，同官方文档写法 -->
<!-- 扩展功能：分页组件、渲染自定义列、loading、表格全局边框、斑马纹、表格尺寸、表头背景配置 -->
<!-- 获取 ref：默认暴露了 elTableRef 外部通过 ref.value.elTableRef 可以调用 el-table 方法 -->
<template>
  <div class="art-table" :class="{ 'is-empty': isEmpty }" :style="containerHeight">
    <ElTable
      ref="elTableRef"
      v-loading="!!loading"
      v-bind="{ ...$attrs, ...props, height, stripe, border, size, headerCellStyle }"
    >
      <template v-for="col in columns" :key="col.prop || col.type">
        <!-- 渲染全局序号列 -->
        <ElTableColumn v-if="col.type === 'globalIndex'" v-bind="{ ...col }">
          <template #default="{ $index }">
            <span>{{ getGlobalIndex($index) }}</span>
          </template>
        </ElTableColumn>

        <!-- 渲染展开行 -->
        <ElTableColumn v-else-if="col.type === 'expand'" v-bind="cleanColumnProps(col)">
          <template #default="{ row }">
            <component :is="col.formatter ? col.formatter(row) : null" />
          </template>
        </ElTableColumn>

        <!-- 渲染普通列 -->
        <ElTableColumn v-else v-bind="cleanColumnProps(col)">
          <template v-if="col.useHeaderSlot && col.prop" #header="headerScope">
            <slot
              :name="col.headerSlotName || `${col.prop}-header`"
              v-bind="{ ...headerScope, prop: col.prop, label: col.label }"
            >
              {{ col.label }}
            </slot>
          </template>
          <template v-if="col.useSlot && col.prop" #default="slotScope">
            <slot
              :name="col.slotName || col.prop"
              v-bind="{
                ...slotScope,
                prop: col.prop,
                value: col.prop ? slotScope.row[col.prop] : undefined
              }"
            />
          </template>
        </ElTableColumn>
      </template>

      <template v-if="$slots.default" #default><slot /></template>

      <template #empty>
        <div v-if="loading"></div>
        <ElEmpty v-else :description="emptyText" :image-size="120" />
      </template>
    </ElTable>

    <div
      class="pagination custom-pagination"
      v-if="showPagination"
      :class="mergedPaginationOptions?.align"
      ref="paginationRef"
    >
      <ElPagination
        v-bind="mergedPaginationOptions"
        :total="pagination?.total"
        :disabled="loading"
        :page-size="pagination?.size"
        :current-page="pagination?.current"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, nextTick } from 'vue'
  import { ElPagination, ElTable, ElTableColumn, ElEmpty } from 'element-plus'
  import { storeToRefs } from 'pinia'
  import { useTableStore } from '@/store/modules/table'
  import { useCommon } from '@/composables/useCommon'
  import { useElementSize, useWindowSize } from '@vueuse/core'

  defineOptions({ name: 'ArtTable' })

  const { width } = useWindowSize()
  const elTableRef = ref(null)
  const paginationRef = ref()
  const tableStore = useTableStore()
  const { isBorder, isZebra, tableSize, isFullScreen, isHeaderBackground } = storeToRefs(tableStore)

  const props = defineProps({
    // --- ArtTableProps 自有属性 ---
    /** 加载状态 */
    loading: {
      type: Boolean
    },
    /** 列渲染配置 */
    columns: {
      type: Array,
      default: () => []
    },
    /** 分页状态 */
    pagination: {
      type: Object,
      // 可选属性，无默认值
      // default: () => ({
      //   /** 当前页码 */
      //   current: undefined,  // number
      //   /** 每页显示条目个数 */
      //   size: undefined,  // number
      //   /** 总条目数 */
      //   total: undefined,  // number
      // })
    },
    /** 分页配置 */
    paginationOptions: {
      type: Object,
      // 可选属性，无默认值
      // default: () => ({
      //   /** 每页显示个数选择器的选项列表 */
      //   pageSizes: undefined,  // number[]
      //   /** 分页器的对齐方式 */
      //   align: undefined,  // 'left' | 'center' | 'right'
      //   /** 分页器的布局 */
      //   layout: undefined,  // string
      //   /** 是否显示分页器背景 */
      //   background: undefined,  // boolean
      //   /** 只有一页时是否隐藏分页器 */
      //   hideOnSinglePage: undefined,  // boolean
      //   /** 分页器的大小 */
      //   size: undefined,  // 'small' | 'default' | 'large'
      //   /** 分页器的页码数量 */
      //   pagerCount: undefined,  // number
      // }),
    },
    /** 空数据表格高度 */
    emptyHeight: {
      type: String,
      default: '360px'
    },
    /** 空数据时显示的文本 */
    emptyText: {
      type: String,
      default: '暂无数据'
    },
    /** 是否开启 ArtTableHeader，解决表格高度自适应问题 */
    showTableHeader: {
      type: Boolean,
      default: true
    },

    // --- 以下属性可能来自继承的 TableProps ---
    fit: {
      type: Boolean,
      default: true
    },
    showHeader: {
      type: Boolean,
      default: true
    },
    stripe: {
      type: Boolean
    },
    border: {
      type: Boolean
    },
    size: {
      type: String
    }
  })

  const LAYOUT = {
    MOBILE: 'prev, pager, next, sizes, jumper, total',
    IPAD: 'prev, pager, next, jumper, total',
    DESKTOP: 'total, prev, pager, next, sizes, jumper'
  }

  const layout = computed(() => {
    if (width.value < 768) {
      return LAYOUT.MOBILE
    } else if (width.value < 1024) {
      return LAYOUT.IPAD
    } else {
      return LAYOUT.DESKTOP
    }
  })

  // 默认分页常量
  const DEFAULT_PAGINATION_OPTIONS = {
    pageSizes: [10, 20, 30, 50, 100],
    align: 'center',
    background: true,
    layout: layout.value,
    hideOnSinglePage: false,
    size: 'default',
    pagerCount: width.value > 1200 ? 7 : 5
  }

  // 合并分页配置
  const mergedPaginationOptions = computed(() => ({
    ...DEFAULT_PAGINATION_OPTIONS,
    ...props.paginationOptions
  }))

  // 边框 (优先级：props > store)
  const border = computed(() => props.border ?? isBorder.value)
  // 斑马纹
  const stripe = computed(() => props.stripe ?? isZebra.value)
  // 表格尺寸
  const size = computed(() => props.size ?? tableSize.value)
  // 数据是否为空
  const isEmpty = computed(() => props.data?.length === 0)

  const { height: paginationHeight } = useElementSize(paginationRef)

  // 容器高度计算
  const containerHeight = computed(() => {
    let offset = 0
    if (!props.showTableHeader) {
      offset = paginationHeight.value === 0 ? 0 : 45
    } else {
      offset = paginationHeight.value === 0 ? 25 : 84
    }
    return { height: offset === 0 ? '100%' : `calc(100% - ${offset}px)` }
  })

  // 表格高度逻辑
  const height = computed(() => {
    // 全屏模式下占满全屏
    if (isFullScreen.value) return '100%'
    // 空数据且非加载状态时固定高度
    if (isEmpty.value && !props.loading) return props.emptyHeight
    // 使用传入的高度
    if (props.height) return props.height
    // 默认占满容器高度
    return '100%'
  })

  // 表头背景颜色样式
  const headerCellStyle = computed(() => ({
    background: isHeaderBackground.value
      ? 'var(--el-fill-color-lighter)'
      : 'var(--art-main-bg-color)',
    ...(props.headerCellStyle || {}) // 合并用户传入的样式
  }))

  // 是否显示分页器
  const showPagination = computed(() => props.pagination && !isEmpty.value)

  // 清理列属性，移除插槽相关的自定义属性，确保它们不会被 ElTableColumn 错误解释
  const cleanColumnProps = (col) => {
    const columnProps = { ...col }
    // 删除自定义的插槽控制属性
    delete columnProps.useHeaderSlot
    delete columnProps.headerSlotName
    delete columnProps.useSlot
    delete columnProps.slotName
    return columnProps
  }

  // 分页大小变化
  const handleSizeChange = (val) => {
    emit('pagination:size-change', val)
  }

  // 分页当前页变化
  const handleCurrentChange = (val) => {
    emit('pagination:current-change', val)
    scrollToTop() // 页码改变后滚动到表格顶部
  }

  // 滚动表格内容到顶部，并可以联动页面滚动到顶部
  const scrollToTop = () => {
    nextTick(() => {
      elTableRef.value?.setScrollTop(0) // 滚动 ElTable 内部滚动条到顶部
      useCommon().scrollToTop() // 调用公共 composable 滚动页面到顶部
    })
  }

  // 全局序号
  const getGlobalIndex = (index) => {
    if (!props.pagination) return index + 1
    const { current, size } = props.pagination
    return (current - 1) * size + index + 1
  }

  const emit = defineEmits(['pagination:size-change', 'pagination:current-change'])

  defineExpose({
    scrollToTop,
    elTableRef
  })
</script>

<style lang="scss" scoped>
  @use './style';
</style>
