import { useUserStore } from '@/store/modules/user'

/**
 * 角色权限指令
 * 只要用户角色包含指令值中的任意一个角色，则显示元素
 * 用法：
 * <el-button v-roles="['R_SUPER', 'R_ADMIN']">按钮</el-button>
 * <el-button v-roles="'R_ADMIN'">按钮</el-button>
 */

function checkRolePermission(el, binding) {
  const userStore = useUserStore()
  const userRoles = userStore.getUserInfo.roles

  // 如果用户角色为空或未定义，移除元素
  if (!userRoles?.length) {
    removeElement(el)
    return
  }

  // 确保指令值为数组格式
  const requiredRoles = Array.isArray(binding.value) ? binding.value : [binding.value]

  // 检查用户是否具有所需角色之一
  const hasPermission = requiredRoles.some((role) => userRoles.includes(role))

  // 如果没有权限，安全地移除元素
  if (!hasPermission) {
    removeElement(el)
  }
}

function removeElement(el) {
  if (el.parentNode) {
    el.parentNode.removeChild(el)
  }
}

const rolesDirective = {
  mounted: checkRolePermission,
  updated: checkRolePermission
}

export function setupRolesDirective(app) {
  app.directive('roles', rolesDirective)
}
