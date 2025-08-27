<template>
  <div class="setting-drawer">
    <el-drawer
      size="300px"
      v-model="visible"
      :lock-scroll="false"
      :with-header="false"
      :before-close="handleClose"
      :destroy-on-close="false"
      modal-class="setting-modal"
      @open="handleOpen"
      @close="handleDrawerClose"
    >
      <div class="drawer-con">
        <slot />
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
  const props = defineProps({
    modelValue: {
      type: Boolean,
      required: true
    }
  })
  const emit = defineEmits(['update:modelValue', 'open', 'close'])

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const handleOpen = () => {
    emit('open')
  }

  const handleDrawerClose = () => {
    emit('close')
  }

  const handleClose = () => {
    visible.value = false
  }
</script>

<style lang="scss" scoped>
  .drawer-con {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
</style>
