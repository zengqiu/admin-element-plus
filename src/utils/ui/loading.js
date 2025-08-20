import { fourDotsSpinnerSvg } from '@/assets/svg/loading'
import { ElLoading } from 'element-plus'

const DEFAULT_LOADING_CONFIG = {
  lock: true,
  background: 'rgba(0, 0, 0, 0)',
  svg: fourDotsSpinnerSvg,
  svgViewBox: '0 0 40 40',
  customClass: 'art-loading-fix'
}


let loadingInstance = null

export const loadingService = {
  /**
   * 显示 loading
   * @returns 关闭 loading 的函数
   */
  showLoading() {
    if (!loadingInstance) {
      loadingInstance = ElLoading.service(DEFAULT_LOADING_CONFIG)
    }
    return () => this.hideLoading()
  },

  /**
   * 隐藏 loading
   */
  hideLoading() {
    if (loadingInstance) {
      loadingInstance.close()
      loadingInstance = null
    }
  }
}
