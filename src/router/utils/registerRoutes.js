/**
 * 动态路由处理
 * 根据接口返回的菜单列表注册动态路由
 */
import { saveIframeRoutes } from './menuToRouter'
import { RoutesAlias } from '../routesAlias'
import { h } from 'vue'
import { useMenuStore } from '@/store/modules/menu'

/**
 * 动态导入 views 目录下所有 .vue 组件
 */
const modules = import.meta.glob('../../views/**/*.vue')

/**
 * 注册异步路由
 * 将接口返回的菜单列表转换为 Vue Router 路由配置，并添加到传入的 router 实例中
 * @param router Vue Router 实例
 * @param menuList 接口返回的菜单列表
 */
export function registerDynamicRoutes(router, menuList) {
  // 用于局部收集 iframe 类型路由
  const iframeRoutes = []
  // 收集路由移除函数
  const removeRouteFns = []

  // 检测菜单列表中是否有重复路由
  checkDuplicateRoutes(menuList)

  // 遍历菜单列表，注册路由
  menuList.forEach((route) => {
    // 只有还没注册过的路由才进行注册
    if (route.name && !router.hasRoute(route.name)) {
      const routeConfig = convertRouteComponent(route, iframeRoutes)
      // addRoute 返回移除函数，收集起来
      const removeRouteFn = router.addRoute(routeConfig)
      removeRouteFns.push(removeRouteFn)
    }
  })

  // 将移除函数存储到 store 中
  const menuStore = useMenuStore()
  menuStore.addRemoveRouteFns(removeRouteFns)

  // 保存 iframe 路由
  saveIframeRoutes(iframeRoutes)
}

/**
 * 路径解析函数：处理父路径和子路径的拼接
 */
function resolvePath(parent, child) {
  return [parent.replace(/\/$/, ''), child.replace(/^\//, '')].filter(Boolean).join('/')
}

/**
 * 检测菜单中的重复路由（包括子路由）
 */
function checkDuplicateRoutes(routes, parentPath = '') {
  // 用于检测动态路由中的重复项
  const routeNameMap = new Map() // 路由名称 -> 路径
  const componentPathMap = new Map() // 组件路径 -> 路由信息

  const checkRoutes = (routes, parentPath = '') => {
    routes.forEach((route) => {
      // 处理路径拼接
      const currentPath = route.path || ''
      const fullPath = resolvePath(parentPath, currentPath)

      // 名称重复检测
      if (route.name) {
        if (routeNameMap.has(String(route.name))) {
          console.warn(`[路由警告] 名称重复: "${String(route.name)}"`)
        } else {
          routeNameMap.set(String(route.name), fullPath)
        }
      }

      // 组件路径重复检测
      if (route.component) {
        const componentPath = getComponentPathString(route.component)

        if (componentPath && componentPath !== RoutesAlias.Layout) {
          const componentKey = `${parentPath}:${componentPath}`

          if (componentPathMap.has(componentKey)) {
            console.warn(`[路由警告] 路径重复: "${componentPath}"`)
          } else {
            componentPathMap.set(componentKey, fullPath)
          }
        }
      }

      // 递归处理子路由
      if (route.children?.length) {
        checkRoutes(route.children, fullPath)
      }
    })
  }

  checkRoutes(routes, parentPath)
}

/**
 * 获取组件路径的字符串表示
 */
function getComponentPathString(component) {
  if (typeof component === 'string') {
    return component
  }

  // 对于其他别名路由，获取组件名称
  for (const key in RoutesAlias) {
    if (RoutesAlias[key] === component) {
      return `RoutesAlias.${key}`
    }
  }

  return ''
}

/**
 * 根据组件路径动态加载组件
 * @param componentPath 组件路径（不包含 ../../views 前缀和 .vue 后缀）
 * @param routeName 当前路由名称（用于错误提示）
 * @returns 组件加载函数
 */
function loadComponent(componentPath, routeName) {
  // 如果路径为空，直接返回一个空的组件
  if (componentPath === '') {
    return () =>
      Promise.resolve({
        render() {
          return h('div', {})
        }
      })
  }

  // 构建可能的路径
  const fullPath = `../../views${componentPath}.vue`
  const fullPathWithIndex = `../../views${componentPath}/index.vue`

  // 先尝试直接路径，再尝试添加/index的路径
  const module = modules[fullPath] || modules[fullPathWithIndex]

  if (!module) {
    console.error(
      `[路由错误] 未找到组件：${routeName}，尝试过的路径: ${fullPath} 和 ${fullPathWithIndex}`
    )
    return () =>
      Promise.resolve({
        render() {
          return h('div', `组件未找到: ${routeName}`)
        }
      })
  }

  return module
}


/**
 * 转换路由组件配置
 */
function convertRouteComponent(
  route,
  iframeRoutes,
  depth = 0
) {
  const { component, children, ...routeConfig } = route

  // 基础路由配置
  const converted = {
    ...routeConfig,
    component: undefined
  }

  // 是否为一级菜单
  const isFirstLevel =
    depth === 0 && route.children?.length === 0 && component !== RoutesAlias.Layout

  if (route.meta.isIframe) {
    handleIframeRoute(converted, route, iframeRoutes)
  } else if (isFirstLevel) {
    handleLayoutRoute(converted, route, component)
  } else {
    handleNormalRoute(converted, component, String(route.name))
  }

  // 递归时增加深度
  if (children?.length) {
    converted.children = children.map((child) =>
      convertRouteComponent(child, iframeRoutes, depth + 1)
    )
  }

  return converted
}

/**
 * 处理 iframe 类型路由
 */
function handleIframeRoute(
  converted,
  route,
  iframeRoutes
) {
  converted.path = `/outside/iframe/${String(route.name)}`
  converted.component = () => import('@/views/outside/Iframe.vue')
  iframeRoutes.push(route)
}

/**
 * 处理一级菜单路由
 */
function handleLayoutRoute(
  converted,
  route,
  component
) {
  converted.component = () => import('@/layout/index.vue')
  converted.path = `/${(route.path?.split('/')[1] || '').trim()}`
  converted.name = ''
  route.meta.isFirstLevel = true

  converted.children = [
    {
      ...route,
      component: loadComponent(component, String(route.name))
    }
  ]
}

/**
 * 处理普通路由
 */
function handleNormalRoute(
  converted,
  component,
  routeName
) {
  if (component) {
    // 新增判断：如果 component 已经是对象或函数（即已导入的组件），则直接使用
    if (typeof component === 'object' || typeof component === 'function') {
      converted.component = component
      return
    }

    const aliasComponent = RoutesAlias[component]
    converted.component = aliasComponent || loadComponent(component, routeName)
  }
}
