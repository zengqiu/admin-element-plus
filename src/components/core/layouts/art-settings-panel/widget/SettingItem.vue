<template>
  <div class="setting-item" :class="{ 'mobile-hide': config.mobileHide }">
    <span class="label">{{ config.label }}</span>

    <!-- 开关类型 -->
    <el-switch v-if="config.type === 'switch'" :model-value="modelValue" @change="handleChange" />

    <!-- 数字输入类型 -->
    <el-input-number
      v-else-if="config.type === 'input-number'"
      :model-value="modelValue"
      :min="config.min"
      :max="config.max"
      :step="config.step"
      :style="config.style"
      :controls-position="config.controlsPosition"
      @change="handleChange"
    />

    <!-- 选择器类型 -->
    <el-select
      v-else-if="config.type === 'select'"
      :model-value="modelValue"
      :style="config.style"
      @change="handleChange"
    >
      <el-option
        v-for="option in normalizedOptions"
        :key="option.value"
        :label="option.label"
        :value="option.value"
      />
    </el-select>
  </div>
</template>

<script setup>
  const props = defineProps({
    config: {
      type: Object,
      required: true,
      // default: () => ({
      //   key: undefined,  // string
      //   label: undefined,  // string
      //   type: undefined,  // 'switch' | 'input-number' | 'select'
      //   handler: undefined,  // string
      //   mobileHide: undefined,  // boolean
      //   min: undefined,  // number
      //   max: undefined,  // number
      //   step: undefined,  // number
      //   style: undefined,  // Record<string, string>
      //   controlsPosition: undefined,  // '' | 'right'
      //   options: undefined,  // Array
      // })
    },
    modelValue: {
      type: null, // 在 Vue props 中，type: null 意味着可以是任何类型
      required: true
    }
  })
  const emit = defineEmits(['change'])

  // 标准化选项，处理computed和普通数组
  const normalizedOptions = computed(() => {
    if (!props.config.options) return []

    try {
      // 如果是 ComputedRef，则返回其值
      if (typeof props.config.options === 'object' && 'value' in props.config.options) {
        return props.config.options.value || []
      }

      // 如果是普通数组，直接返回
      return Array.isArray(props.config.options) ? props.config.options : []
    } catch (error) {
      console.warn('Error processing options for config:', props.config.key, error)
      return []
    }
  })

  const handleChange = (value) => {
    try {
      emit('change', value)
    } catch (error) {
      console.error('Error handling change for config:', props.config.key, error)
    }
  }
</script>

<style lang="scss" scoped>
  .setting-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 25px;
    background: transparent !important;

    .label {
      font-size: 14px;
      background: transparent !important;
    }
  }

  @media screen and (width <= 768px) {
    .mobile-hide {
      display: none !important;
    }
  }
</style>
