import { useTheme } from '@/composables/useTheme'
import { useSettingStore } from '@/store/modules/setting'
import AppConfig from '@/config'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import i18n, { $t } from '@/locales'

/** 顶部进度条配置 */
export const configureNProgress = () => {
  NProgress.configure({
    easing: 'ease',
    speed: 600,
    showSpinner: false,
    trickleSpeed: 200,
    parent: 'body'
  })
}

/**
 * 设置页面标题，根据路由元信息和系统信息拼接标题
 * @param to 当前路由对象
 */
export const setPageTitle = (to) => {
  const { title } = to.meta
  if (title) {
    setTimeout(() => {
      document.title = `${formatMenuTitle(String(title))} - ${AppConfig.systemInfo.name}`
    }, 150)
  }
}

/**
 * 根据路由元信息设置系统主题
 * @param to 当前路由对象
 */
export const setSystemTheme = (to) => {
  if (to.meta.setTheme) {
    useTheme().switchThemeStyles(useSettingStore().systemThemeType)
  }
}

/**
 * 格式化菜单标题
 * @param title 菜单标题，可以是 i18n 的 key，也可以是字符串
 * @returns 格式化后的菜单标题
 */
export const formatMenuTitle = (title) => {
  if (title) {
    if (title.startsWith('menus.')) {
      // 使用 te() 方法检查翻译键值是否存在，避免控制台警告
      if (i18n.global.te(title)) {
        return $t(title)
      } else {
        // 如果翻译不存在，返回键值的最后部分作为fallback
        return title.split('.').pop() || title
      }
    }
    return title
  }
  return ''
}
