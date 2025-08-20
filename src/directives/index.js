import { setupAuthDirective } from './auth'
import { setupRippleDirective } from './ripple'
import { setupRolesDirective } from './roles'

export function setupGlobDirectives(app) {
  setupAuthDirective(app) // 权限指令
  setupRolesDirective(app) // 角色权限指令
  setupRippleDirective(app) // 水波纹指令
}
