/**
 * 全局事件总线，用于全局事件的发布与订阅
 * 用法：
 * mittBus.on('event', callback)
 * mittBus.emit('event', data)
 */
import mitt from 'mitt'

// 创建类型安全的事件总线实例
const mittBus = mitt()

export default mittBus
