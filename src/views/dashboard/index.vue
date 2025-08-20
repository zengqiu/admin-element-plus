<template>
  <div class="console">
    空白页
  </div>
</template>

<script setup>
  import { useCommon } from '@/composables/useCommon'

  defineOptions({ name: 'Dashboard' })

  useCommon().scrollToTop()
</script>
