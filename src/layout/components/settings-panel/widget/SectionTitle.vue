<template>
  <p class="section-title" :style="style">
    {{ title }}
  </p>
</template>

<script setup>
  defineProps({
    title: {
      type: String,
      required: true
    },
    style: {
      type: Object  // {string: any}
    }
  })
</script>

<style lang="scss" scoped>
  .section-title {
    position: relative;
    margin: 30px 0 20px;
    font-size: 14px;
    color: var(--art-text-gray-800);
    text-align: center;

    &::before,
    &::after {
      position: absolute;
      top: 10px;
      width: 50px;
      margin: auto;
      content: '';
      border-bottom: 1px solid rgba(var(--art-gray-300-rgb), 0.8);
    }

    &::before {
      left: 0;
    }

    &::after {
      right: 0;
    }
  }
</style>
