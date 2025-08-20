import { upgradeLogList } from '@/mock/upgrade/changeLog'
import { ElNotification } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import { StorageConfig } from '@/utils/storage/storage-config'

/**
 * 版本管理器
 * 负责处理版本比较、升级检测和数据清理
 */
class VersionManager {
  /**
   * 规范化版本号字符串，移除前缀 'v'
   */
  normalizeVersion(version) {
    return version.replace(/^v/, '')
  }

  /**
   * 获取存储的版本号
   */
  getStoredVersion() {
    return localStorage.getItem(StorageConfig.VERSION_KEY)
  }

  /**
   * 设置版本号到存储
   */
  setStoredVersion(version) {
    localStorage.setItem(StorageConfig.VERSION_KEY, version)
  }

  /**
   * 检查是否应该跳过升级处理
   */
  shouldSkipUpgrade() {
    return StorageConfig.CURRENT_VERSION === StorageConfig.SKIP_UPGRADE_VERSION
  }

  /**
   * 检查是否为首次访问
   */
  isFirstVisit(storedVersion) {
    return !storedVersion
  }

  /**
   * 检查版本是否相同
   */
  isSameVersion(storedVersion) {
    return storedVersion === StorageConfig.CURRENT_VERSION
  }

  /**
   * 查找旧的存储结构
   */
  findLegacyStorage() {
    const storageKeys = Object.keys(localStorage)
    const currentVersionPrefix = StorageConfig.generateStorageKey('').slice(0, -1) // 移除末尾的 '-'

    // 查找旧的单一存储结构
    const oldSysKey =
      storageKeys.find(
        (key) =>
          StorageConfig.isVersionedKey(key) && key !== currentVersionPrefix && !key.includes('-')
      ) || null

    // 查找旧版本的分离存储键
    const oldVersionKeys = storageKeys.filter(
      (key) =>
        StorageConfig.isVersionedKey(key) &&
        !StorageConfig.isCurrentVersionKey(key) &&
        key.includes('-')
    )

    return { oldSysKey, oldVersionKeys }
  }

  /**
   * 检查是否需要重新登录
   */
  shouldRequireReLogin(storedVersion) {
    const normalizedCurrent = this.normalizeVersion(StorageConfig.CURRENT_VERSION)
    const normalizedStored = this.normalizeVersion(storedVersion)

    return upgradeLogList.value.some((item) => {
      const itemVersion = this.normalizeVersion(item.version)
      return (
        item.requireReLogin && itemVersion > normalizedStored && itemVersion <= normalizedCurrent
      )
    })
  }

  /**
   * 构建升级通知消息
   */
  buildUpgradeMessage(requireReLogin) {
    const { title: content } = upgradeLogList.value[0]

    const messageParts = [
      `<p style="color: var(--art-gray-text-800) !important; padding-bottom: 5px;">`,
      `系统已升级到 ${StorageConfig.CURRENT_VERSION} 版本，此次更新带来了以下改进：`,
      `</p>`,
      content
    ]

    if (requireReLogin) {
      messageParts.push(
        `<p style="color: var(--main-color); padding-top: 5px;">升级完成，请重新登录后继续使用。</p>`
      )
    }

    return messageParts.join('')
  }

  /**
   * 显示升级通知
   */
  showUpgradeNotification(message) {
    ElNotification({
      title: '系统升级公告',
      message,
      duration: 0,
      type: 'success',
      dangerouslyUseHTMLString: true
    })
  }

  /**
   * 清理旧版本数据
   */
  cleanupLegacyData(oldSysKey, oldVersionKeys) {
    // 清理旧的单一存储结构
    if (oldSysKey) {
      localStorage.removeItem(oldSysKey)
      console.info(`[Upgrade] 已清理旧存储: ${oldSysKey}`)
    }

    // 清理旧版本的分离存储
    oldVersionKeys.forEach((key) => {
      localStorage.removeItem(key)
      console.info(`[Upgrade] 已清理旧存储: ${key}`)
    })
  }

  /**
   * 执行升级后的登出操作
   */
  performLogout() {
    try {
      useUserStore().logOut()
      console.info('[Upgrade] 已执行升级后登出')
    } catch (error) {
      console.error('[Upgrade] 升级后登出失败:', error)
    }
  }

  /**
   * 执行升级流程
   */
  async executeUpgrade(
    storedVersion,
    legacyStorage
  ) {
    try {
      if (!upgradeLogList.value.length) {
        console.warn('[Upgrade] 升级日志列表为空')
        return
      }

      const requireReLogin = this.shouldRequireReLogin(storedVersion)
      const message = this.buildUpgradeMessage(requireReLogin)

      // 显示升级通知
      this.showUpgradeNotification(message)

      // 更新版本号
      this.setStoredVersion(StorageConfig.CURRENT_VERSION)

      // 清理旧数据
      this.cleanupLegacyData(legacyStorage.oldSysKey, legacyStorage.oldVersionKeys)

      // 执行登出（如果需要）
      if (requireReLogin) {
        this.performLogout()
      }

      console.info(`[Upgrade] 升级完成: ${storedVersion} → ${StorageConfig.CURRENT_VERSION}`)
    } catch (error) {
      console.error('[Upgrade] 系统升级处理失败:', error)
    }
  }

  /**
   * 系统升级处理主流程
   */
  async processUpgrade() {
    // 跳过特定版本
    if (this.shouldSkipUpgrade()) {
      console.debug('[Upgrade] 跳过版本升级检查')
      return
    }

    const storedVersion = this.getStoredVersion()

    // 首次访问处理
    if (this.isFirstVisit(storedVersion)) {
      this.setStoredVersion(StorageConfig.CURRENT_VERSION)
      console.info('[Upgrade] 首次访问，已设置当前版本')
      return
    }

    // 版本相同，无需升级
    if (this.isSameVersion(storedVersion)) {
      // console.debug('[Upgrade] 版本相同，无需升级')
      return
    }

    // 检查是否有需要升级的旧数据
    const legacyStorage = this.findLegacyStorage()
    if (!legacyStorage.oldSysKey && legacyStorage.oldVersionKeys.length === 0) {
      this.setStoredVersion(StorageConfig.CURRENT_VERSION)
      console.info('[Upgrade] 无旧数据，已更新版本号')
      return
    }

    // 延迟执行升级流程，确保应用已完全加载
    setTimeout(() => {
      this.executeUpgrade(storedVersion, legacyStorage)
    }, StorageConfig.UPGRADE_DELAY)
  }
}

// 创建版本管理器实例
const versionManager = new VersionManager()

/**
 * 系统升级处理入口函数
 */
export async function systemUpgrade() {
  await versionManager.processUpgrade()
}
