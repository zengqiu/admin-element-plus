import { useWorktabStore } from '@/store/modules/worktab'
import { isIframe } from './route'
import { useSettingStore } from '@/store/modules/setting'
import { getIframeRoutes } from '@/router/utils/menuToRouter'
import { useCommon } from '@/composables/useCommon'

/**
 * 根据当前路由信息设置工作标签页（worktab）
 * @param to 当前路由对象
 */
export const setWorktab = (to) => {
  const worktabStore = useWorktabStore()
  const { meta, path, name, params, query } = to
  if (!meta.isHideTab) {
    // 如果是 iframe 页面，则特殊处理工作标签页
    if (isIframe(path)) {
      const iframeRoute = getIframeRoutes().find((route) => route.path === to.path)

      if (iframeRoute?.meta) {
        worktabStore.openTab({
          title: iframeRoute.meta.title,
          path,
          name: name,
          keepAlive: meta.keepAlive,
          params,
          query
        })
      }
    } else if (useSettingStore().showWorkTab || path === useCommon().homePath.value) {
      worktabStore.openTab({
        title: meta.title,
        path,
        name: name,
        keepAlive: meta.keepAlive,
        params,
        query,
        fixedTab: meta.fixedTab
      })
    }
  }
}
