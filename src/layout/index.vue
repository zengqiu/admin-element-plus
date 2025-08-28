<!-- 布局容器组件 -->
<template>
  <div class="layouts" :style="layoutStyle">
    <slot>
      <!-- 顶栏、水平/混合菜单 -->
      <HeaderBar />
      <!-- 左侧/双列菜单 -->
      <SidebarMenu />
      <!-- 页面内容 -->
      <PageContent />
      <!-- 设置面板 -->
      <SettingsPanel />
      <!-- 全局搜索 -->
      <GlobalSearch />
      <!-- 屏幕锁定 -->
      <ScreenLock />
      <!-- 聊天窗口 -->
      <Chat />
      <!-- 水印效果 -->
      <Watermark />
    </slot>
  </div>
</template>

<script setup>
  import '@/assets/styles/transition.scss'
  import { MenuWidth, MenuTypeEnum } from '@/enums/appEnum'
  import { useMenuStore } from '@/store/modules/menu'
  import { useSettingStore } from '@/store/modules/setting'
  import { getTabConfig } from '@/utils/ui'
  import { useRouter } from 'vue-router'
  import HeaderBar from './components/header-bar/index.vue'
  import SidebarMenu from './components/menus/sidebar-menu/index.vue'
  import PageContent from './components/page-content/index.vue'
  import SettingsPanel from './components/settings-panel/index.vue'
  import GlobalSearch from './components/global-search/index.vue'
  import ScreenLock from './components/screen-lock/index.vue'
  import Chat from './components/chat/index.vue'
  import Watermark from './components/watermark/index.vue'

  defineOptions({ name: 'Layout' })

  const settingStore = useSettingStore()
  const menuStore = useMenuStore()
  const router = useRouter()

  const { menuType, menuOpen, showWorkTab, tabStyle } = storeToRefs(settingStore)

  // 菜单宽度变化
  watchEffect(() => {
    const isOpen = menuOpen.value
    const width = isOpen ? settingStore.getMenuOpenWidth : MenuWidth.CLOSE
    menuStore.setMenuWidth(width)
  })

  // 布局样式
  const layoutStyle = computed(() => ({
    paddingLeft: paddingLeft.value,
    paddingTop: paddingTop.value
  }))

  // 左侧距离
  const paddingLeft = computed(() => {
    const { meta } = router.currentRoute.value
    const isFirstLevel = meta.isFirstLevel
    const type = menuType.value
    const isOpen = menuOpen.value
    const width = isOpen ? settingStore.getMenuOpenWidth : MenuWidth.CLOSE

    switch (type) {
      case MenuTypeEnum.DUAL_MENU:
        return isFirstLevel ? '80px' : `calc(${width} + 80px)`
      case MenuTypeEnum.TOP_LEFT:
        return isFirstLevel ? 0 : width
      case MenuTypeEnum.TOP:
        return 0
      default:
        return width
    }
  })

  // 顶部距离
  const paddingTop = computed(() => {
    const { openTop, closeTop } = getTabConfig(tabStyle.value)
    return `${showWorkTab.value ? openTop : closeTop}px`
  })
</script>

<style lang="scss" scoped>
  @use './style';
</style>
