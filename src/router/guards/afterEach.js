import { useSettingStore } from '@/store/modules/setting'
import NProgress from 'nprogress'

/** 路由全局后置守卫 */
export function setupAfterEachGuard(router) {
  router.afterEach(() => {
    if (useSettingStore().showNprogress) NProgress.done()
  })
}
