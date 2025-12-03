<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useMatchState } from '../composables/useMatchState'
import type { SeatWind, Meld } from '../types/match'
import { Mahgen } from 'mahgen'

// 设置窗口标题
onMounted(() => {
  document.title = '花听直播-悬浮窗-madeby比尔'
})

const { matchState } = useMatchState()

// 分数变化动画数据
interface ScoreChange {
  playerId: string
  change: number
  id: number
}

const scoreChanges = ref<ScoreChange[]>([])
let changeIdCounter = 0

// 监听每个玩家的分数变化
watch(
  () => matchState.value.players,
  (newPlayers, oldPlayers) => {
    if (!oldPlayers || oldPlayers.length === 0) return
    
    newPlayers.forEach((newPlayer, index) => {
      const oldPlayer = oldPlayers[index]
      if (oldPlayer && oldPlayer.score !== newPlayer.score) {
        const change = newPlayer.score - oldPlayer.score
        if (change !== 0) {
          // 添加分数变化动画
          const changeId = changeIdCounter++
          scoreChanges.value.push({
            playerId: newPlayer.id,
            change: change,
            id: changeId
          })
          
          // 2秒后移除
          setTimeout(() => {
            const index = scoreChanges.value.findIndex(c => c.id === changeId)
            if (index > -1) {
              scoreChanges.value.splice(index, 1)
            }
          }, 2000)
        }
      }
    })
  },
  { deep: true }
)

// 从 res 目录加载资源（仅使用无符号文件，直接使用 mahgen 格式）
const resourceModules = import.meta.glob('../../res/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const tileMap: Record<string, string> = {}
Object.entries(resourceModules).forEach(([path, src]) => {
  const code = path.split('/').pop()?.replace('.png', '')
  if (code) {
    // 只使用无符号文件（不包含 _ 或 =），直接使用 mahgen 格式
    if (!code.includes('_') && !code.includes('=') && code !== 'space') {
      tileMap[code.toLowerCase()] = src
    }
  }
})

const windModules = import.meta.glob('../img/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>
const windMap: Record<string, string> = {}
Object.entries(windModules).forEach(([path, src]) => {
  const key = path.split('/').pop()?.replace('.png', '')
  if (key) {
    windMap[key.toLowerCase()] = src
  }
})

const translate = (round: string) => {
  const num = Number.parseInt(round)
  if (num === 1) return '一'
  if (num === 2) return '二'
  if (num === 3) return '三'
  if (num === 4) return '四'
  if (num === 5) return '五'
  if (num === 6) return '六'
  if (num === 7) return '七'
  if (num === 8) return '八'
  if (num === 9) return '九'
  if (num === 10) return '十'
  if (num === 11) return '十一'
  if (num === 12) return '十二'
  if (num === 13) return '十三'
  if (num === 14) return '十四'
  if (num === 15) return '十五'
  if (num === 16) return '十六'
  if (num === 17) return '十七'
  return round
}
const currentWindImage = computed(() => {
  const text = matchState.value.currentRound || ''
  if (text.includes('南')) return windMap.nan
  if (text.includes('东')) return windMap.ton
  return undefined
})

const formatScore = (score: number) => {
  const num = Number(score)
  if (Number.isNaN(num)) return score
  return num.toLocaleString()
}

// 生成副露图片的 base64
const meldImageCache = ref<Record<string, string>>({})

const getMeldImage = async (meld: Meld): Promise<string> => {
  const cacheKey = `${meld.id}-${meld.seq}`
  
  if (meldImageCache.value[cacheKey]) {
    return meldImageCache.value[cacheKey]
  }
  
  try {
    const base64 = await Mahgen.render(meld.seq, false)
    meldImageCache.value[cacheKey] = base64
    return base64
  } catch (error) {
    console.error('Failed to render meld:', error)
    return ''
  }
}

// 判断是否是加杠（kakan）
// 加杠的特征：序列中包含 'v' 前缀（加杠特有的横置标记）
const isKakan = (meld: Meld): boolean => {
  return meld.seq.includes('v')||meld.seq.includes('^')
}

// 为每个副露生成图片
const meldImages = ref<Record<string, string>>({})

watch(
  () => matchState.value.players,
  async (players) => {
    for (const player of players) {
      if (player.melds) {
        for (const meld of player.melds) {
          const key = `${player.id}-${meld.id}`
          if (!meldImages.value[key]) {
            meldImages.value[key] = await getMeldImage(meld)
          }
        }
      }
    }
  },
  { deep: true, immediate: true }
)

// 获取分数变化动画的位置样式
const getScoreChangeStyle = (playerId: string) => {
  const playerIndex = matchState.value.players.findIndex(p => p.id === playerId)
  if (playerIndex === -1) return {}
  
  // 计算该玩家卡片的位置
  // 4列布局，每列占 25%，间距 16px
  // 每列中心位置 = 索引 * 25% + 12.5%（列中心）
  const columnWidth = 25 // 每列占25%
  const leftPercent = playerIndex * columnWidth + columnWidth / 2
  
  return {
    left: `${leftPercent}%`,
    transform: 'translateX(-50%)'
  }
}
</script>

<template>
  <div class="overlay-root">
    <section class="match-card round-card">
      <div class="match-logo" v-if="matchState.matchLogoUrl">
        <img :src="matchState.matchLogoUrl" alt="match logo" />
      </div>
      <div class="match-info">
        <div class="match-name">{{ matchState.matchName }}</div>
        <div class="match-subtitle">{{ matchState.subtitle }}</div>
        <div class="match-subtitleinfo">{{ matchState.subtitle2 }}</div>
        <div class="match-subtitleinfo">{{ matchState.subtitle3 }}</div>
      </div>
      <div class="match-number">
        <div class="match-number-item" v-if="matchState.matchNumber">
          第{{ matchState.matchNumber }}半庄
        </div>
      </div>
    </section>
    <div class="top-bar">
      <section class="round-card">
        <div class="round-content">
          <div class="round-header">
            <div>
              <span class="round-label">{{ matchState.sessionLabel + translate(matchState.currentRound) + '局'}}</span>
            </div>
          </div>
          <div class="round-meta">
            <div class="meta-item">
              <img src="../img/场供.png" alt="场供" />
              <strong>{{ matchState.riichiSticks }}</strong>
            </div>
            <div class="meta-item">
              <img src="../img/本场.png" alt="本场" />
              <strong>{{ matchState.honba }}</strong>
            </div>
          </div>
          <div class="round-meta treasure-tiles">
            <div class="treasure-tiles-list">
              <img
                v-for="(tile, index) in matchState.treasureTile"
                :key="index"
                :src="tileMap[tile.replace('.png', '').toLowerCase()] || ''"
                :alt="tile"
                class="treasure-tile-img"
              />
              <span v-if="!matchState.treasureTile?.length" class="treasure-empty">无</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- <section v-if="tenpaiRows.length" class="tenpai-panel">
      <div
        v-for="row in tenpaiRows"
        :key="row.label"
        class="tenpai-row"
        :class="{ ready: row.ready }"
      >
        <span class="tenpai-label">{{ row.label }}</span>
        <div class="tiles">
          <template v-if="row.tiles?.length">
            <img
              v-for="tile in row.tiles"
              :key="tile.code"
              :src="tile.src || ''"
              class="tile"
              :alt="tile.code"
            />
          </template>
          <span v-else class="fallback-text">{{ row.label }}</span>
        </div>
      </div>
    </section> -->

    <div class="video-gap" />

    <div class="score-row-container">
      <!-- 分数变化动画 -->
      <div
        v-for="change in scoreChanges"
        :key="change.id"
        class="score-change-animation"
        :class="{ positive: change.change > 0, negative: change.change < 0 }"
        :style="getScoreChangeStyle(change.playerId)"
      >
        {{ change.change > 0 ? '+' : '' }}{{ formatScore(change.change) }}
      </div>
    </div>
    <section class="score-row">
      <article
        v-for="(player, index) in matchState.players"
        :key="player.id"
        class="score-card"
      >
       
        <div class="card-body">
          <div class="logo" v-if="player.teamLogoUrl">
            <img :src="player.teamLogoUrl" :alt="player.teamName" />
            <!-- 状态指示层 -->
            <div class="status-overlay" v-if="player.tenpai">
              <!-- 振听状态 - 左上三角 -->
              <div 
                class="status-triangle-left furiten-triangle" 
                v-if="player.tenpai.isFuriten"
              ><span>振听</span></div>
              <!-- 立直状态 - 右下三角 -->
              <div 
                class="status-triangle-right" 
                :class="{ 'riichi-triangle': player.tenpai.status === 'riichi', 'tenpai-triangle': player.tenpai.status === 'tenpai' }"
              >
              <span v-if="player.tenpai.status === 'riichi'">立直</span>
              <span v-if="player.tenpai.status === 'tenpai'">听牌</span>
            </div>
            </div>
          </div>
          <div class="content">
       <!-- Melds Display -->
       <div v-if="player.melds?.length" class="player-melds">
              <div v-for="(meld, meldIndex) in player.melds" :key="meld.id" :class="{'meld-group': player.melds.length<3, 'meld-group3': player.melds.length>=3}">
                <img 
                  v-if="meldImages[`${player.id}-${meld.id}`]"
                  :src="meldImages[`${player.id}-${meld.id}`]"
                  :alt="`meld-${meld.id}`"
                  :class="{ 
                    'meld-image': player.melds.length<3 && !isKakan(meld), 
                    'meld-image-kakan': isKakan(meld) && player.melds.length<3,
                    'meld-image3': player.melds.length===3 && !isKakan(meld),
                    'meld-image3-kakan': isKakan(meld) && player.melds.length===3,
                    'meld-image4': player.melds.length===4 && !isKakan(meld),
                    'meld-image4-kakan': isKakan(meld) && player.melds.length===4
                  }"
                />
              </div>
            </div>
            <div class="score-header">
              <div class="score-header-left" :class="{ highlight: index+1 === Number(matchState.currentRound) }">

              </div>
              <div class="score-header-content">
              <div class="badge" :style="{ color: player.badgeColor }">
                {{ player.badgeText }}
              </div>
              <!-- <span class="seat-pill">{{ seatLabel[player.wind] }}</span> -->
              <div class="score-info">
                <!-- <div class="video-gap"><p v-if="player.ptPoint">PT: {{ player.ptPoint }}</p></div> -->
                <p class="score-value">{{ formatScore(player.score) }}</p>
              </div>
                
              </div>
            </div>
            <div class="team-name-container" v-if="!player.tenpai">
              <p class="team-name" :style="{ color: player.badgeColor }">{{ player.teamName }}</p>
            </div>
            <!-- Tenpai Display -->
            <div v-if="player.tenpai" class="player-tenpai" :style="{ background: player.tenpai.status === 'riichi' ? 'rgba(0, 255, 0, 0.8)' : 'rgba(0, 0, 255, 0.8)' }">
              <div class="tenpai-tiles-display">
                <div v-for="tile in player.tenpai.tiles" :key="tile.code" class="tenpai-tile-display" :class="{ 'has-yaku': tile.status === 'yaku', 'no-yaku': tile.status === 'noyaku' }">
                  <img :src="tileMap[tile.code.toLowerCase()] || ''" :alt="tile.code" class="tenpai-tile-img" />
                  <span v-if="tile.count" class="tile-count-display">{{ tile.count }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.overlay-root {
  width: 100%;
  height: 100vh;
  /* padding: 32px 32px 0 32px; */
  display: flex;
  flex-direction: column;
  gap: 20px;
  color: #e8f1ff;
  font-family: '微软雅黑', 'Microsoft YaHei', 'Inter', sans-serif;
  pointer-events: none;
  box-sizing: border-box;
  overflow: hidden;
}

.top-bar {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.round-card {
  background: rgba(5, 9, 17, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  padding: 10px 12px;
  backdrop-filter: blur(16px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.35);
  width: fit-content;
}


.round-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.round-header {
  display: flex;
  gap: 16px;
  align-items: center;
  /* 白色边框，加阴影 */
  border: 2px solid #ffffff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 1);
  border-radius: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.06);
}

.wind-icon {
  width: 110px;
}

.wind-icon img {
  width: 100%;
  object-fit: contain;
}

.round-label {
  margin: 0;
  font-size: 16px;
  /* 文字加粗，加阴影 */
  font-weight: bold;
  text-shadow: 0 0 10px rgba(0, 0, 0, 1);
  color: rgba(255, 255, 255, 1);
}

.round-title {
  margin: 4px 0 0;
  font-size: 30px;
  letter-spacing: 4px;
}

.round-meta {
  display: flex;
  flex-direction: column;
  /* gap: 8px; */
}

.meta-item {
  /* background: rgba(255, 255, 255, 0.06); */
  /* border-radius: 12px; */
  /* padding: 10px 12px; */
  text-align: center;
  font-size: 14px;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  /* gap: 8px; */
  white-space: nowrap;
}

.meta-item img {
  width: 130px;
  height: 30px;
  object-fit: contain;
}

.meta-label {
  display: block;
  color: rgba(255, 255, 255, 0.01);
  font-size: 12px;
}

.treasure-tiles {
  flex-direction: column;
  gap: 4px;
  width: fit-content !important;
  align-items: flex-start;
  justify-content: flex-start !important;
  white-space: normal !important;
  flex: 0 0 auto;
}

.treasure-tiles-list {
  display: flex;
  gap: 0;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.treasure-tile-img {
  width: 40px;
  height: 40px;
  object-fit: contain;
  margin: 0;
  padding: 0;
  display: block;
}

.treasure-empty {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.match-card {
  position: fixed;
  /* top: 32px; */
  right: 0px;
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 10;
}

.match-logo img {
  max-height: 80px;
  object-fit: contain;
  /* 透明 */
  /* opacity: 0.5; */
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.45));
  -webkit-app-region: drag;
}

.match-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.match-name {
  font-size: 30px;
  letter-spacing: 3px;
}

.match-subtitle {
  font-size: 30px;
  color: rgba(255, 255, 255, 1);
}

.match-subtitleinfo {
  font-size: 24px;
  /* 给字加上白色加粗，黑色阴影 */
  text-shadow: 0 0 10px rgba(0, 0, 0, 1);
  font-weight: bold;
  color: rgba(255, 255, 255, 1);
}

.match-number {
  display: flex;
  align-items: center;
}

.match-number-item {
  font-size: 32px;
  font-weight: 400;
  letter-spacing: 2px;
  /* 文字从上到下排列 */
  writing-mode: vertical-rl;
  text-orientation: upright;
}

.tenpai-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tenpai-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 18px;
  background: rgba(13, 25, 38, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

.tenpai-row.ready {
  background: rgba(38, 198, 218, 0.15);
  border-color: rgba(38, 198, 218, 0.4);
}

.tenpai-label {
  font-size: 18px;
  min-width: 80px;
}

.tiles {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tile {
  height: 52px;
  width: auto;
}

.fallback-text {
  color: rgba(255, 255, 255, 0.6);
}

.video-gap {
  flex: 1;
}

.score-row-container {
  position: relative;
  width: 100%;
  min-height: 80px;
  margin-bottom: -80px;
  pointer-events: none;
  z-index: 50;
}

.score-change-animation {
  position: absolute;
  top: 20px;
  font-size: 36px;
  font-weight: 900;
  white-space: nowrap;
  z-index: 100;
  pointer-events: none;
  animation: scoreChangeFloat 2s ease-out forwards;
  text-shadow: 
    0 0 10px rgba(0, 0, 0, 0.8),
    0 2px 4px rgba(0, 0, 0, 0.6),
    0 4px 8px rgba(0, 0, 0, 0.4);
  letter-spacing: 1px;
}

.score-change-animation.positive {
  color: #22c55e;
}

.score-change-animation.negative {
  color: #ef4444;
}

@keyframes scoreChangeFloat {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(20px) scale(0.8);
  }
  20% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
  80% {
    opacity: 1;
    transform: translateX(-50%) translateY(-20px) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-40px) scale(0.8);
  }
}

.score-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  position: relative;
  margin-top: auto;
}

.score-card {
  background: transparent;
  color: #e8f1ff;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
}

.score-card.highlight {
  border: 3px solid #f97316;
  border-radius: 18px;
  box-shadow: 0 25px 35px rgba(249, 115, 22, 0.35);
  height: 100%;
}

.score-header-content {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 1);
  width: 100%;
  height: 100%;
}

.score-header-left {
  background: rgba(255, 255, 255, 1);
  height: 100%;
  width: 5%;
}

.score-header-left.highlight {
  background: #ff0000;
  height: 100%;
  width: 5%;
}
.badge {
  align-self: flex-start;
  justify-self: flex-start;
  padding: 4px 10px;
  border-radius: 999px;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.card-body {
  display: flex;
  gap: 12px;
  height: 100%;
  align-items: center;
}

.logo {
  width: 140px;
  height: 100%;
  border-radius: 14px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 20%;
  pointer-events: none;
}

.status-triangle-left {
  position: absolute;
  display: flex;
  align-self: flex-start;
  justify-content: left;
  color: #fff;
  font-weight: bold;
  font-size: 20px;
  height: 100%;
}

.status-triangle-right {
  position: absolute;
  display: flex;
  align-self: flex-end;
  justify-content: right;
  color: #fff;
  font-weight: bold;
  font-size: 20px;
  height: 100%;
}

.furiten-triangle {
  /* 左侧三角形 - 振听状态 */
  left: 0;
  width: 100%;
  background: rgba(255, 0, 0, 0.8);
  clip-path: polygon(0 0, 100% 0, 0 100%);
}

.riichi-triangle {
  /* 右侧三角形 - 立直状态 */
  right: 0;
  width: 100%;
  background: rgba(0, 255, 0, 0.8);
  clip-path: polygon(100% 0, 100% 100%, 0 100%);
}

.tenpai-triangle {
  /* 右侧三角形 - 听牌状态 */
  right: 0;
  width: 100%;
  background: rgba(0, 0, 255, 0.8);
  clip-path: polygon(100% 0, 100% 100%, 0 100%);
}

.content {
  flex: 1;
  position: relative;
  padding-top: 28px;
  height: 100%;
}

.score-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgb(255, 255, 255， 0);
  margin-top: 10px;
  height: 60%;
  position: relative;
}

.score-info {
  position: absolute;
  bottom: 4px;
  right: 8px;
  text-align: right;
}

.score-info .video-gap {
  margin: 0;
}

.score-info .video-gap p {
  margin: 0;
  font-size: 12px;
  color: rgba(15, 23, 42, 0.7);
}

.score-info .score-value {
  margin: 2px 0 0 0;
  font-size: 28px;
  font-weight: 800;
}

.player-name {
  font-size: 20px;
  font-weight: 700;
}

.seat-pill {
  background: rgba(15, 23, 42, 0.1);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 13px;
}

.team-name-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 40%;
}
.team-name {
  margin: 4px 0;
  font-size: 14px;
}

.score-value {
  font-size: 32px;
  color: #000000;
  font-weight: 800;
  margin: 2px 0;
}

.tagline {
  margin: 0;
  font-size: 13px;
  color: rgba(15, 23, 42, 0.65);
}

/* Player Melds and Tenpai Styles */
.player-melds {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 24px;
  display: flex;
  gap: 4px;
  align-items: baseline;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  padding: 2px 4px;
  z-index: 100;
  margin-bottom: 4px;
}

.meld-group {
  display: flex;
  align-items: center;
  margin-right: 6px;
  flex-shrink: 0;
}

.meld-group3 {
  display: flex;
  align-items: center;
  margin-right: 0px;
  flex-shrink: 0;
}

.meld-image {
  height: 30px;
  width: auto;
  object-fit: contain;
  display: block;
}

.meld-image-kakan {
  height: 42px !important; /* 30px * 1.4 */
  width: auto;
  object-fit: contain;
  display: block;
}

.meld-image3 {
  height: 20px;
  width: auto;
  object-fit: contain;
  display: block;
}

.meld-image3-kakan {
  height: 28px !important; /* 20px * 1.4 */
  width: auto;
  object-fit: contain;
  display: block;
}

.meld-image4 {
  height: 15px;
  width: auto;
  object-fit: contain;
  display: block;
}

.meld-image4-kakan {
  height: 21px !important; /* 15px * 1.4 */
  width: auto;
  object-fit: contain;
  display: block;
}

.player-tenpai {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 20%;
  pointer-events: none;
}

.tenpai-status-display {
  display: flex;
  gap: 4px;
  align-items: center;
}

.tenpai-badge {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 500;
}

.tenpai-badge.tenpai {
  background: rgba(59, 130, 246, 0.15);
  color: #1d4ed8;
}

.tenpai-badge.riichi {
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
}

.furiten-badge {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
}

.tenpai-tiles-display {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translate(10%, -50%);
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tenpai-tile-display {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 2px;
  transition: all 0.2s ease;
}

.tenpai-tile-display.has-yaku {
  /* 有役时高亮 */
  transform: scale(1.1);
  filter: brightness(1.2) saturate(1.3);
}

.tenpai-tile-display.has-yaku .tenpai-tile-img {
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
  border-radius: 2px;
}

.tenpai-tile-display.no-yaku {
  /* 无役时变灰暗 */
  opacity: 0.5;
  filter: grayscale(0.7) brightness(0.8);
}

.tenpai-tile-img {
  width: 16px;
  height: 20px;
  object-fit: contain;
  transition: all 0.2s ease;
}

.tile-status-display {
  font-size: 8px;
  padding: 1px 3px;
  border-radius: 2px;
}

.tile-status-display.yaku {
  background: rgba(34, 197, 94, 0.15);
  color: #16a34a;
}

.tile-status-display.noyaku {
  background: rgba(107, 114, 128, 0.15);
  color: #6b7280;
}

.tile-count-display {
  font-size: 8px;
  color: white;
}

@media (max-width: 1280px) {
  .top-bar {
    flex-direction: column;
  }
  .match-card {
    top: 16px;
    right: 16px;
  }
  .score-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

html, body {
  margin: 0;
  padding: 0;
  background: transparent;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.window-border {
  position: absolute;
  inset: 0;
  border: 2px solid rgba(255,255,255,0.6); /* 自定义边框颜色 */
  border-radius: 8px; /* 可选 */
  pointer-events: none; /* 不阻挡点击 */
}


@media (max-width: 768px) {
  .score-row {
    grid-template-columns: 1fr;
  }
}
</style>

