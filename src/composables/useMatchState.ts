import { onBeforeUnmount, onMounted, ref, nextTick } from 'vue'
import type { MatchState } from '../types/match'
import { defaultMatchState } from '../types/match'

const sharedState = ref<MatchState>({ ...defaultMatchState })
let unsubscribe: (() => void) | null = null
let isInitialized = false
let mountCounter = 0

// 深度更新函数，保持响应式连接
function deepUpdate(target: any, source: any): void {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return
  }
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key]
      if (
        typeof sourceValue === 'object' &&
        sourceValue !== null &&
        !Array.isArray(sourceValue) &&
        target[key] &&
        typeof target[key] === 'object' &&
        !Array.isArray(target[key])
      ) {
        // 递归更新嵌套对象
        deepUpdate(target[key], sourceValue)
      } else {
        // 直接更新属性，保持响应式连接
        target[key] = sourceValue
      }
    }
  }
}

export function useMatchState() {
  const loading = ref(!isInitialized)

  const hydrate = async () => {
    const api = window.matchAPI
    if (!api) {
      console.warn('[match] matchAPI 不可用，使用默认数据。')
      loading.value = false
      return
    }

    try {
      const state = await api.getState()
      // 使用深度更新而不是直接替换，确保响应式连接不中断
      deepUpdate(sharedState.value, state)
      await nextTick() // 确保Vue处理完响应式更新
      isInitialized = true
      loading.value = false
    } catch (error) {
      console.error('[match] 获取状态失败', error)
      loading.value = false
    }
  }

  onMounted(() => {
    mountCounter += 1

    if (!isInitialized) {
      hydrate()
    } else {
      loading.value = false
    }

    if (!unsubscribe && window.matchAPI) {
      const api = window.matchAPI
      unsubscribe = api.onStateChange(async (state: MatchState) => {
        // 使用深度更新和nextTick确保响应式更新
        deepUpdate(sharedState.value, state)
        await nextTick()
      })
    }
  })

  onBeforeUnmount(() => {
    mountCounter = Math.max(0, mountCounter - 1)
    if (mountCounter === 0 && unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  })

  const updateState = async (payload: MatchState) => {
    if (!window.matchAPI) {
      console.warn('[match] matchAPI 不可用，无法更新状态。')
      return
    }
    await window.matchAPI.updateState(payload)
  }

  return {
    matchState: sharedState,
    loading,
    updateState,
  }
}

