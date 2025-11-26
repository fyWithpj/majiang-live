import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { MatchState } from '../types/match'
import { defaultMatchState } from '../types/match'

const sharedState = ref<MatchState>({ ...defaultMatchState })
let unsubscribe: (() => void) | null = null
let isInitialized = false
let mountCounter = 0

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
      sharedState.value = state
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
      unsubscribe = api.onStateChange((state: MatchState) => {
        sharedState.value = state
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

