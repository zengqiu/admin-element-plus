<template>
  <Exception
    :data="{
      title: '500',
      desc: $t('exceptionPage.500'),
      btnText: $t('exceptionPage.gohome'),
      imgUrl
    }"
  />
</template>

<script setup>
  import imgUrl from '@imgs/svg/500.svg'
  import Exception from '../components/exception/index.vue'

  defineOptions({ name: 'Exception500' })
</script>
