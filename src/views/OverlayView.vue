<script setup lang="ts">
import { computed } from 'vue'
import { useMatchState } from '../composables/useMatchState'
import type { SeatWind } from '../types/match'

const { matchState } = useMatchState()

const resourceModules = import.meta.glob('../Resources/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>
const tileMap: Record<string, string> = {}
Object.entries(resourceModules).forEach(([path, src]) => {
  const key = path.split('/').pop()?.replace('.png', '')
  if (key) {
    tileMap[key.toLowerCase()] = src
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
</script>

<template>
  <div class="overlay-root">
    <section class="match-card">
      <div class="match-logo" v-if="matchState.matchLogoUrl">
        <img :src="matchState.matchLogoUrl" alt="match logo" />
      </div>
      <div class="match-info">
        <div class="match-name">{{ matchState.matchName }}</div>
        <div class="match-subtitle">{{ matchState.subtitle }}</div>
      </div>
      <div class="match-number">
        <div class="match-number-item" v-if="matchState.matchNumber">
          {{ matchState.matchNumber }}
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
              <img src="../img/本场.png" alt="本场" />
              <strong>{{ matchState.honba }}</strong>
            </div>
            <div class="meta-item">
              <img src="../img/场供.png" alt="场供" />
              <strong>{{ matchState.riichiSticks }}</strong>
            </div>
          </div>
          <div class="round-meta treasure-tiles">
            <div class="treasure-tiles-list">
              <img
                v-for="(tile, index) in matchState.treasureTile"
                :key="index"
                :src="tileMap[tile.replace('.png', '').toLowerCase()] || tileMap.questionmark"
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
              :src="tile.src || tileMap.questionmark"
              class="tile"
              :alt="tile.code"
            />
          </template>
          <span v-else class="fallback-text">{{ row.label }}</span>
        </div>
      </div>
    </section> -->

    <div class="video-gap" />

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
              
              <div v-for="(meld, meldIndex) in player.melds" :key="meld.id" class="meld-group">
                    <span v-for="(tile, tileIndex) in meld.tiles" :key="`${meld.id}-${tile.code}-${tileIndex}`">
                      <template v-if="tile.orientation === 'horizontal' || tile.orientation === 'doublehorizontal'">
                        <div class="horizontal-stack-preview">
                          <img 
                            :src="tileMap[tile.code.toLowerCase()]"
                            :alt="tile.code"
                            :class="['meld-tile-display', tile.orientation]"
                          />
                          <img 
                            v-if="tile.orientation === 'doublehorizontal'" 
                            :src="tileMap[tile.code.toLowerCase()]" 
                            :alt="tile.code" 
                            class="meld-tile-display doublehorizontal" 
                          />
                        </div>
                      </template>
                      <template v-else>
                        <img 
                          :src="tileMap[tile.code.toLowerCase()]"
                          :alt="tile.code"
                          :class="['meld-tile-display', tile.orientation]"
                        />
                      </template>
                    </span>
                </div>
            </div>
            <div class="score-header">
              <div class="score-header-left" :class="{ highlight: index+1 === Number(matchState.currentRound) }">

              </div>
              <div class="score-header-content">
              <div class="badge" :style="{ background: player.badgeColor }">
                {{ player.badgeText }}
              </div>
              <!-- <span class="seat-pill">{{ seatLabel[player.wind] }}</span> -->
              <div class="score-info">
                <div class="video-gap"><p v-if="player.ptPoint">PT: {{ player.ptPoint }}</p></div>
                <p class="score-value">{{ formatScore(player.score) }}</p>
              </div>
                
              </div>
            </div>
            <div class="team-name-container" v-if="!player.tenpai">
              <p class="team-name">{{ player.teamName }}</p>
            </div>
            <!-- Tenpai Display -->
            <div v-if="player.tenpai" class="player-tenpai" :style="{ background: player.tenpai.status === 'riichi' ? 'rgba(0, 255, 0, 0.8)' : 'rgba(0, 0, 255, 0.8)' }">
              <div class="tenpai-tiles-display">
                <div v-for="tile in player.tenpai.tiles" :key="tile.code" class="tenpai-tile-display" :class="{ 'has-yaku': tile.status === 'yaku', 'no-yaku': tile.status === 'noyaku' }">
                  <img :src="tileMap[tile.code.toLowerCase()]" :alt="tile.code" class="tenpai-tile-img" />
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
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  color: #e8f1ff;
  font-family: '微软雅黑', 'Microsoft YaHei', 'Inter', sans-serif;
  pointer-events: none;
  box-sizing: border-box;
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
  /* 白色边框 */
  border: 1px solid #ffffff;
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
  top: 32px;
  right: 32px;
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 10;
}

.match-logo img {
  max-height: 80px;
  object-fit: contain;
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.45));
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
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
}

.match-number {
  display: flex;
  align-items: center;
}

.match-number-item {
  font-size: 50px;
  font-weight: 400;
  letter-spacing: 2px;
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

.score-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
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
  width: 100%;
  height: 100%;
}

.score-header-left {
  background: #ffffff;
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
  font-size: 13px;
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
  font-size: 12px;
  height: 100%;
}

.status-triangle-right {
  position: absolute;
  display: flex;
  align-self: flex-end;
  justify-content: right;
  color: #fff;
  font-weight: bold;
  font-size: 12px;
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
  background: rgb(255, 255, 255);
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
  font-size: 24px;
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
  color: rgba(255, 255, 255, 0.65);
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
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  padding: 2px 4px;
  margin-bottom: 4px;
}

.meld-group {
  /* display: flex;
  gap: 2px;
  align-items: center; */
  display: flex;
  align-items: center;
  margin-right: 10px;
}

.meld-tile-display {
  /* width: 16px; */
  height: 20px;
  object-fit: contain;
}

.meld-tile-display.horizontal {
  transform: rotate(-90deg);
  width: 20px;
  /* height: 20px; */
}

.meld-tile-display.doublehorizontal {
  transform: rotate(-90deg);
  width: 20px;
  object-fit: contain;
  margin: -2px 0;
  padding: 0;
  display: block;
  vertical-align: top;
}

.horizontal-stack-preview {
  display: flex;
  flex-direction: column;
  gap: 0;
  align-items: center;
  height: 20px;
  justify-content: flex-end;
  line-height: 0;
  font-size: 0;
}

.horizontal-stack-preview img {
  margin: -1px 0;
  vertical-align: top;
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

@media (max-width: 768px) {
  .score-row {
    grid-template-columns: 1fr;
  }
}
</style>

