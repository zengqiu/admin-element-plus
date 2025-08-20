<!-- 更多按钮 -->
<template>
  <div class="btn-more">
    <ElDropdown v-if="hasAnyAuthItem">
      <ArtButtonTable type="more" :iconBgColor="!hasBackground ? 'transparent' : ''" />
      <template #dropdown>
        <ElDropdownMenu>
          <template v-for="item in list" :key="item.key">
            <ElDropdownItem
              v-if="!item.auth || hasAuth(item.auth)"
              :disabled="item.disabled"
              @click="handleClick(item)"
            >
              {{ item.label }}
            </ElDropdownItem>
          </template>
        </ElDropdownMenu>
      </template>
    </ElDropdown>
  </div>
</template>

<script setup>
  import { useAuth } from '@/composables/useAuth'

  defineOptions({ name: 'ArtButtonMore' })

  const { hasAuth } = useAuth()

  const props = defineProps({
    /** 下拉项列表 */
    list: {
      type: Array,  // [{key: string | number, label: string, disabled?: boolean, auth?: string}]
      required: true
    },
    /** 整体权限控制 */
    auth: {
      type: String
    },
    /** 是否显示背景 */
    hasBackground: {
      type: Boolean,
      default: true
    }
  })

  // 检查是否有任何有权限的 item
  const hasAnyAuthItem = computed(() => {
    return props.list.some((item) => !item.auth || hasAuth(item.auth))
  })

  const emit = defineEmits(['click'])

  const handleClick = (item) => {
    emit('click', item)
  }
</script>
