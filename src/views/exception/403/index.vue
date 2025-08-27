<template>
  <Exception
    :data="{
      title: '403',
      desc: $t('exceptionPage.403'),
      btnText: $t('exceptionPage.gohome'),
      imgUrl
    }"
  />
</template>

<script setup>
  import imgUrl from '@imgs/svg/403.svg'
  import Exception from '../components/exception/index.vue'

  defineOptions({ name: 'Exception403' })
</script>
