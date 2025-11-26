<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useMatchState } from '../composables/useMatchState'
import type { MatchState, PlayerBoard, TenpaiOption, SeatWind, Meld, MeldTile, PlayerTenpai, TenpaiTile, TileOrientation, TenpaiStatus, TileStatus, MeldType, SourcePlayer } from '../types/match'

const { matchState, updateState } = useMatchState()
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | 'info' | ''>('')
const submitting = ref(false)

const windOptions: { label: string; value: SeatWind }[] = [
  { label: '东', value: 'east' },
  { label: '南', value: 'south' },
  { label: '西', value: 'west' },
  { label: '北', value: 'north' },
]

const sessionOptions = [
  { label: '东', value: '东' },
  { label: '南', value: '南' },
]

const meldTypeOptions = [
  { label: '吃', value: 'chi' as MeldType },
  { label: '碰', value: 'pon' as MeldType },
  { label: '明杠', value: 'minkan' as MeldType },
  { label: '加杠', value: 'kakan' as MeldType },
  { label: '暗杠', value: 'ankan' as MeldType },
]

const sourcePlayerOptions = [
  { label: '上家', value: 'kamicha' as SourcePlayer },
  { label: '对家', value: 'toimen' as SourcePlayer },
  { label: '下家', value: 'shimocha' as SourcePlayer },
]

// 宝牌资源列表 - 从 Resources 目录动态加载
const resourceModules = import.meta.glob('../Resources/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const tileNameMap: Record<string, string> = {
  m1: '一万', m2: '二万', m3: '三万', m4: '四万', m5: '五万',
  m6: '六万', m7: '七万', m8: '八万', m9: '九万',
  p1: '一筒', p2: '二筒', p3: '三筒', p4: '四筒', p5: '五筒',
  p6: '六筒', p7: '七筒', p8: '八筒', p9: '九筒',
  s1: '一索', s2: '二索', s3: '三索', s4: '四索', s5: '五索',
  s6: '六索', s7: '七索', s8: '八索', s9: '九索',
  ze: '东', zs: '南', zw: '西', zn: '北',
  zwh: '白',zg: '发',  zr: '中',
}

const treasureTileOptions = Object.entries(resourceModules)
  .map(([path, src]) => {
    const filename = path.split('/').pop() || ''
    const code = filename.replace('.png', '')
    return {
      label: tileNameMap[code] || code,
      value: filename,
      code: code,
      src: src,
    }
  })
  .filter(opt => opt.code !== 'questionmark') // 排除问号图片
  .sort((a, b) => {
    // 按 tileNameMap 中定义的顺序排序
    const tileOrder = Object.keys(tileNameMap)
    const aIndex = tileOrder.indexOf(a.code)
    const bIndex = tileOrder.indexOf(b.code)
    
    // 如果都在 tileNameMap 中，按索引排序
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex
    }
    
    // 如果只有一个在 tileNameMap 中，在 tileNameMap 中的排在前面
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    
    // 如果都不在 tileNameMap 中，按字母顺序排序
    return a.code.localeCompare(b.code)
  })

const form = reactive<MatchState>({
  sessionLabel: '',
  currentRound: '',
  matchNumber: 1,
  fieldSupply: '',
  treasureTile: [],
  matchName: '',
  matchLogoUrl: '',
  subtitle: '',
  honba: 0,
  riichiSticks: 0,
  players: [],
})

const currentRoundNum = ref<number>(1)

// Modal states
const showMeldModal = ref(false)
const showTenpaiModal = ref(false)
const currentPlayerId = ref<string>('')

// Meld modal data
const meldForm = reactive({
  type: 'chi' as MeldType,
  sourcePlayer: 'kamicha' as SourcePlayer,
  selectedTiles: [] as string[], // Selected tile codes
  tiles: [] as MeldTile[]
})

// Tenpai modal data
const tenpaiForm = reactive<PlayerTenpai>({
  status: 'tenpai' as TenpaiStatus,
  isFuriten: false,
  tiles: []
})

// Image input types
const matchLogoInputType = ref<'url' | 'file'>('url')
const playerLogoInputTypes = reactive<Record<string, 'url' | 'file'>>({})

// Helper function to get tile image
const getTileImage = (code: string) => {
  const tileOption = treasureTileOptions.find(opt => opt.code === code)
  return tileOption?.src || treasureTileOptions.find(opt => opt.code === 'questionmark')?.src
}

// Helper function to get consecutive horizontal tiles for stacking
const getConsecutiveHorizontalTiles = (tiles: MeldTile[], startIndex: number) => {
  const result = []
  for (let i = startIndex; i < tiles.length; i++) {
    const tile = tiles[i]
    if (tile.orientation === 'horizontal' || tile.orientation === 'doublehorizontal') {
      result.push(tile)
    } else {
      break
    }
  }
  return result
}

// Helper function to check if a tile should be skipped (already rendered in a stack)
const shouldSkipTile = (tiles: MeldTile[], currentIndex: number) => {
  // Check if this tile is part of a horizontal stack that started earlier
  for (let i = 0; i < currentIndex; i++) {
    const prevTile = tiles[i]
    if (prevTile.orientation === 'horizontal' || prevTile.orientation === 'doublehorizontal') {
      // Check if there's a continuous sequence from i to currentIndex
      let continuous = true
      for (let j = i; j <= currentIndex; j++) {
        if (!(tiles[j].orientation === 'horizontal' || tiles[j].orientation === 'doublehorizontal')) {
          continuous = false
          break
        }
      }
      if (continuous) return true
    }
  }
  return false
}

watch(
  matchState,
  value => {
    const state = JSON.parse(JSON.stringify(value))
    // 兼容旧数据：如果 treasureTile 是字符串，转换为数组
    if (typeof state.treasureTile === 'string') {
      state.treasureTile = state.treasureTile ? [state.treasureTile] : []
    }
    Object.assign(form, state)
    const num = Number.parseInt(value.currentRound) || 1
    currentRoundNum.value = num > 0 ? num : 1
  },
  { immediate: true },
)

watch(currentRoundNum, (val) => {
  if (val > 0) {
    form.currentRound = String(val)
  }
})

const submit = async () => {
  submitting.value = true
  try {
    // 确保局次数字已同步到字符串
    form.currentRound = String(currentRoundNum.value > 0 ? currentRoundNum.value : 1)
    console.log(JSON.parse(JSON.stringify(form)))
    await updateState(JSON.parse(JSON.stringify(form)))
    showToast('已更新到展示界面', 'success')
  } catch (error) {
    console.error(error)
    showToast('更新失败，请检查控制台', 'error', 5000)
  } finally {
    submitting.value = false
  }
}

// Toast 通知函数
const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000) => {
  statusMessage.value = message
  statusType.value = type
  
  setTimeout(() => {
    statusMessage.value = ''
    statusType.value = ''
  }, duration)
}

const clearAllData = () => {
  if (confirm('确定要清空所有数据吗？此操作不可撤销。')) {
    // 重置表单数据
    Object.assign(form, {
   "sessionLabel": "东",
   "currentRound": "1",
   "matchNumber": 0,
   "fieldSupply": "",
   "treasureTile": [
   ],
   "matchName": "",
   "matchLogoUrl": "",
   "subtitle": "",
   "honba": 0,
   "riichiSticks": 0,
   "players": [
       {
           "id": "p1",
           "badgeText": "选手1",
           "badgeColor": "#6dd400",
           "playerName": "选手1",
           "teamName": "战队1",
           "teamLogoUrl": "https://q8.itc.cn/images01/20241022/cc4b10e6d3334352a05fae4b715a0582.png",
           "tagline": "",
           "score": 25000,
           "ptPoint": "",
           "wind": "",
           "highlight": false,
           "melds": [],
           "tenpai": null,
       },
       {
           "id": "p2",
           "badgeText": "选手2",
           "badgeColor": "#f472b6",
           "playerName": "选手2",
           "teamName": "战队2",
           "teamLogoUrl": "https://q8.itc.cn/images01/20241022/cc4b10e6d3334352a05fae4b715a0582.png",
           "tagline": "",
           "score": 25000,
           "ptPoint": "",
           "wind": "",
           "highlight": false,
           "melds": [
     
           ],
           "tenpai": null,
       },
       {
           "id": "p3",
           "badgeText": "选手3",
           "badgeColor": "#60a5fa",
           "playerName": "选手3",
           "teamName": "战队3",
           "teamLogoUrl": "https://q8.itc.cn/images01/20241022/cc4b10e6d3334352a05fae4b715a0582.png",
           "tagline": "",
           "score": 25000,
           "ptPoint": "",
           "wind": "",
           "highlight": false,
           "melds": [],
           "tenpai": null,
       },
       {
           "id": "p4",
           "badgeText": "选手4",
           "badgeColor": "#f59e0b",
           "playerName": "选手4",
           "teamName": "战队4",
           "teamLogoUrl": "https://q8.itc.cn/images01/20241022/cc4b10e6d3334352a05fae4b715a0582.png",
           "tagline": "",
           "score": 25000,
           "ptPoint": "",
           "wind": "",
           "highlight": false,
           "melds": [],
           "tenpai": null,
       }
   ]
 })
    
    // 重置当前局次数字
    currentRoundNum.value = 1
    
    // 显示成功提示
    showToast('所有数据已清空', 'success')
    
    console.log('所有数据已清空')
  }
}


const addTreasureTile = () => {
  form.treasureTile.push('')
}

const removeTreasureTile = (index: number) => {
  form.treasureTile.splice(index, 1)
}

const clearTreasureTiles = () => {
  form.treasureTile = []
}

// Meld methods
const openMeldModal = (playerId: string) => {
  currentPlayerId.value = playerId
  meldForm.type = 'chi'
  meldForm.sourcePlayer = 'kamicha'
  meldForm.selectedTiles = []
  meldForm.tiles = []
  showMeldModal.value = true
}

const toggleTileSelection = (tileCode: string) => {
  const index = meldForm.selectedTiles.indexOf(tileCode)
  if (index > -1) {
    meldForm.selectedTiles.splice(index, 1)
  } else {
    // Check selection limits based on meld type
    const maxTiles = meldForm.type === 'chi' ? 3 : 1
    if (meldForm.selectedTiles.length < maxTiles) {
      meldForm.selectedTiles.push(tileCode)
    }
  }
}

const isTileSelected = (tileCode: string) => {
  return meldForm.selectedTiles.includes(tileCode)
}

const saveMeld = () => {
  // Validation based on meld type
  const requiredTiles = meldForm.type === 'chi' ? 3 : 1
  if (meldForm.selectedTiles.length !== requiredTiles) {
    const typeName = meldTypeOptions.find(opt => opt.value === meldForm.type)?.label
    alert(`${typeName}需要选择${requiredTiles}张牌`)
    return
  }
  
  const player = form.players.find(p => p.id === currentPlayerId.value)
  if (player) {
    // Generate tiles with proper orientations
    const tiles: MeldTile[] = []
    
    if (meldForm.type === 'chi') {
      // For chi, first tile is horizontal (from source player), others vertical
      meldForm.selectedTiles.forEach((code, index) => {
        tiles.push({
          code,
          orientation: index === 0 ? 'horizontal' : 'vertical'
        })
      })
    } else if (meldForm.type === 'ankan') {
      for (let i = 0; i < 4; i++) {
        tiles.push({
          code: meldForm.selectedTiles[0],
          orientation: i === 0||i === 3 ? 'backend' : 'vertical'
        })
      }
    } else {
      // For pon/kan, one tile horizontal (from source player), others vertical
      const tileCode = meldForm.selectedTiles[0]
      console.log(meldForm.type)
      const tileCount = meldForm.type === 'pon' || meldForm.type === 'kakan' ? 3 : 4
      console.log(tileCount)
      const sourcePlayerNumber = meldForm.sourcePlayer === 'kamicha' ? 0 : meldForm.sourcePlayer === 'toimen' ? 1 : 2
      
      for (let i = 0; i < tileCount; i++) {
        tiles.push({
          code: tileCode,
          orientation: i === sourcePlayerNumber ? meldForm.type === 'kakan' ? 'doublehorizontal' : 'horizontal' : 'vertical'
        })
      }
    }
    
    const newMeld: Meld = {
      id: Date.now().toString(),
      type: meldForm.type,
      tiles,
      sourcePlayer: meldForm.type === 'ankan' ? undefined : meldForm.sourcePlayer
    }
    console.log(JSON.parse(JSON.stringify(newMeld)))
    player.melds.push(newMeld)
  }
  
  showMeldModal.value = false
}

const removeMeld = (playerId: string, meldIndex: number) => {
  const player = form.players.find(p => p.id === playerId)
  if (player) {
    player.melds.splice(meldIndex, 1)
  }
}

// Tenpai methods
const openTenpaiModal = (playerId: string) => {
  currentPlayerId.value = playerId
  const player = form.players.find(p => p.id === playerId)
  if (player?.tenpai) {
    Object.assign(tenpaiForm, player.tenpai)
  } else {
    tenpaiForm.status = 'tenpai'
    tenpaiForm.isFuriten = false
    tenpaiForm.tiles = []
  }
  showTenpaiModal.value = true
}

const addTenpaiTile = () => {
  tenpaiForm.tiles.push({
    code: '',
    status: 'yaku',
    count: undefined
  })
}

const removeTenpaiTile = (index: number) => {
  tenpaiForm.tiles.splice(index, 1)
}

const saveTenpai = () => {
  const player = form.players.find(p => p.id === currentPlayerId.value)
  if (player) {
    player.tenpai = {
      status: tenpaiForm.status,
      isFuriten: tenpaiForm.isFuriten,
      tiles: [...tenpaiForm.tiles]
    }
  }
  showTenpaiModal.value = false
}

const clearTenpai = () => {
  const player = form.players.find(p => p.id === currentPlayerId.value)
  if (player) {
    player.tenpai = null
  }
  showTenpaiModal.value = false
}

// Image handling functions
const handleMatchLogoFile = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      form.matchLogoUrl = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const handlePlayerLogoFile = (playerId: string, event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const player = form.players.find(p => p.id === playerId)
      if (player) {
        player.teamLogoUrl = e.target?.result as string
      }
    }
    reader.readAsDataURL(file)
  }
}

const initializePlayerLogoType = (playerId: string) => {
  if (!playerLogoInputTypes[playerId]) {
    playerLogoInputTypes[playerId] = 'url'
  }
}
</script>

<template>
  <div class="panel-root">
    <!-- Toast 通知 -->
    <div v-if="statusMessage" :class="['toast-notification', statusType]">
      <div class="toast-content">
        <span class="toast-icon">
          <span v-if="statusType === 'success'">✓</span>
          <span v-if="statusType === 'error'">✕</span>
          <span v-if="statusType === 'info'">ℹ</span>
        </span>
        <span class="toast-message">{{ statusMessage }}</span>
        <button class="toast-close" @click="statusMessage = ''; statusType = ''" type="button">×</button>
      </div>
    </div>
    
    <h1>赛事控制面板</h1>
    <section>
      <h2>牌局信息</h2>
      <div class="grid two">
        <label>
          场次
          <select v-model="form.sessionLabel">
            <option v-for="opt in sessionOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </label>
        <label>
          当前局次
          <input v-model.number="currentRoundNum" type="number" min="1" />
        </label>
        <label>
          本场
          <input v-model.number="form.honba" type="number" min="0" />
        </label>
        <label>
          场供
          <input v-model.number="form.riichiSticks" type="number" min="0" />
        </label>
        <label class="full">
          <div class="title-row">
            <h2 style="margin: 0;">宝牌</h2>
            <div style="display: flex; gap: 8px;">
              <button type="button" class="ghost" @click="addTreasureTile">+ 添加</button>
              <button type="button" class="ghost danger" @click="clearTreasureTiles" :disabled="!form.treasureTile.length">清空</button>
            </div>
          </div>
          <div v-if="!form.treasureTile.length" class="empty-tip">尚未添加宝牌，点击上方按钮添加。</div>
          <div class="treasure-tile-list">
            <div v-for="(tile, index) in form.treasureTile" :key="index" class="treasure-tile-item">
              <div class="treasure-tile-selector">
                <select v-model="form.treasureTile[index]" class="treasure-select">
                  <option value="">请选择宝牌</option>
                  <option v-for="opt in treasureTileOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
                <div v-if="form.treasureTile[index]" class="treasure-preview">
                  <img 
                    :src="treasureTileOptions.find(opt => opt.value === form.treasureTile[index])?.src" 
                    :alt="form.treasureTile[index]" 
                  />
                </div>
              </div>
              <button type="button" class="ghost danger" @click="removeTreasureTile(index)">移除</button>
            </div>
          </div>
        </label>
        <label class="full">
          比赛名称
          <input v-model="form.matchName" />
        </label>
        <label class="full">
          比赛副标题
          <input v-model="form.subtitle" placeholder="例如：2025.11.23" />
        </label>
        <label>
          半庄数
          <input v-model.number="form.matchNumber" type="number" min="1" />
        </label>
        <label class="full">
          <div class="image-input-section">
            <div class="title-row">
              <span>比赛 Logo</span>
              <div class="input-type-buttons">
                <button 
                  type="button"
                  :class="['input-type-btn', { active: matchLogoInputType === 'url' }]"
                  @click="matchLogoInputType = 'url'"
                >
                  链接
                </button>
                <button 
                  type="button"
                  :class="['input-type-btn', { active: matchLogoInputType === 'file' }]"
                  @click="matchLogoInputType = 'file'"
                >
                  本地图片
                </button>
              </div>
            </div>
            <input 
              v-if="matchLogoInputType === 'url'"
              v-model="form.matchLogoUrl" 
              placeholder="https://example.com/logo.png" 
            />
            <input 
              v-else
              type="file"
              accept="image/*"
              @change="handleMatchLogoFile"
              class="file-input"
            />
            <div v-if="form.matchLogoUrl" class="image-preview">
              <img :src="form.matchLogoUrl" alt="比赛Logo预览" class="preview-image" />
            </div>
          </div>
        </label>
      </div>
    </section>

    <section>
      <div class="title-row">
        <h2>战队信息</h2>
        <!-- <button type="button" class="ghost" @click="addPlayer" :disabled="form.players.length >= 4">+ 添加</button> -->
      </div>
      <p class="hint">建议保持 4 个战队以匹配底部布局。</p>
      <div v-if="!form.players.length" class="empty-tip">尚未添加战队。</div>
      <div class="players-row">
        <article v-for="(player, index) in form.players" :key="player.id" class="player-config">
        <header>
          <h3>战队 {{ index + 1 }}</h3>
          <!-- <button type="button" class="ghost danger" @click="removePlayer(index)">移除</button> -->
        </header>
        <div class="grid one">
          <label>
            选手名称
            <input v-model="player.badgeText" />
          </label>
          <label>
            名称颜色
            <input :style="{ background: player.badgeColor }" v-model="player.badgeColor" type="color" />
          </label>
          <!-- <label>
            选手名称
            <input v-model="player.playerName" />
          </label> -->
          <label class="full">
            <div class="title-row">
              <span>副露选择</span>
              <button type="button" class="ghost" @click="openMeldModal(player.id)">+ 添加副露</button>
            </div>
            <div v-if="!player.melds.length" class="empty-tip">尚未添加副露</div>
            <div class="meld-list">
                <div v-for="(meld, meldIndex) in player.melds" :key="meld.id" class="meld-item">
                  <div class="meld-preview">
                    <span v-for="(tile, tileIndex) in meld.tiles" :key="`${meld.id}-${tile.code}-${tileIndex}`">
                      <template v-if="tile.orientation === 'horizontal' || tile.orientation === 'doublehorizontal'">
                        <div class="horizontal-stack-preview">
                          <img 
                            :src="getTileImage(tile.code)"
                            :alt="tile.code"
                            :class="['meld-tile', tile.orientation]"
                          />
                          <img 
                            v-if="tile.orientation === 'doublehorizontal'" 
                            :src="getTileImage(tile.code)" 
                            :alt="tile.code" 
                            class="meld-tile doublehorizontal" 
                          />
                        </div>
                      </template>
                      <template v-else>
                        <img 
                          :src="getTileImage(tile.code)"
                          :alt="tile.code"
                          :class="['meld-tile', tile.orientation]"
                        />
                      </template>
                    </span>
                  </div>
                  <button type="button" class="ghost danger" @click="removeMeld(player.id, meldIndex)">移除</button>
                </div>
            </div>
          </label>
          <label class="full">
            <div class="title-row">
              <span>听牌选择</span>
              <button type="button" class="ghost" @click="openTenpaiModal(player.id)">配置听牌</button>
            </div>
            <div v-if="!player.tenpai" class="empty-tip">尚未配置听牌</div>
            <div v-else class="tenpai-preview">
              <div class="tenpai-status">
                <span class="status-badge" :class="player.tenpai.status">{{ player.tenpai.status === 'riichi' ? '立直' : '听牌' }}</span>
                <span v-if="player.tenpai.isFuriten" class="furiten-badge">振听</span>
              </div>
              <div class="tenpai-tiles">
                <div v-for="tile in player.tenpai.tiles" :key="tile.code" class="tenpai-tile-item">
                  <img :src="getTileImage(tile.code)" :alt="tile.code" class="tenpai-tile" />
                  <span class="tile-status" :class="tile.status">{{ tile.status === 'yaku' ? '有役' : '无役' }}</span>
                  <span v-if="tile.count" class="tile-count">{{ tile.count }}张</span>
                </div>
              </div>
            </div>
          </label>
          <label class="full">
            <div class="image-input-section">
              <div class="title-row">
                <span>战队 Logo</span>
                <div class="input-type-buttons">
                  <button 
                    type="button"
                    :class="['input-type-btn', { active: (playerLogoInputTypes[player.id] || 'url') === 'url' }]"
                    @click="initializePlayerLogoType(player.id); playerLogoInputTypes[player.id] = 'url'"
                  >
                    链接
                  </button>
                  <button 
                    type="button"
                    :class="['input-type-btn', { active: (playerLogoInputTypes[player.id] || 'url') === 'file' }]"
                    @click="initializePlayerLogoType(player.id); playerLogoInputTypes[player.id] = 'file'"
                  >
                    本地图片
                  </button>
                </div>
              </div>
              <input 
                v-if="(playerLogoInputTypes[player.id] || 'url') === 'url'"
                v-model="player.teamLogoUrl" 
                placeholder="https://example.com/team.png" 
              />
              <input 
                v-else
                type="file"
                accept="image/*"
                @change="handlePlayerLogoFile(player.id, $event)"
                class="file-input"
              />
              <div v-if="player.teamLogoUrl" class="image-preview">
                <img :src="player.teamLogoUrl" alt="战队Logo预览" class="preview-image" />
              </div>
            </div>
          </label>
          <!-- <label class="full">
            副标题/口号
            <input v-model="player.tagline" placeholder="例：齐柏林未潜艇" />
          </label> -->
          <label>
            分数
            <input v-model.number="player.score" type="number" />
          </label>
          <!-- <label>
            座位风
            <select v-model="player.wind">
              <option v-for="opt in windOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </label> -->
          <!-- <label class="radio">
            <input v-model="player.highlight" type="radio" />
            设为当前焦点
          </label> -->
        </div>
      </article>
      </div>
    </section>

    <div class="floating-submit">
      <div class="button-row">
        <button class="primary" :disabled="submitting" @click="submit">
          {{ submitting ? '提交中...' : '提交更新' }}
        </button>
        <button class="ghost danger" @click="clearAllData" :disabled="submitting">
          清空所有数据
        </button>
      </div>
    </div>

    <!-- Meld Modal -->
    <div v-if="showMeldModal" class="modal-overlay" @click="showMeldModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>配置副露</h3>
          <button class="close-btn" @click="showMeldModal = false">×</button>
        </div>
        <div class="modal-body">
          <!-- Meld Type Selection -->
          <div class="meld-type-section">
            <label>副露类型</label>
            <div class="meld-type-buttons">
              <button 
                v-for="option in meldTypeOptions" 
                :key="option.value"
                type="button"
                :class="['meld-type-btn', { active: meldForm.type === option.value }]"
                @click="meldForm.type = option.value; meldForm.selectedTiles = []"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <!-- Source Player Selection (not for ankan) -->
          <div v-if="meldForm.type !== 'ankan'" class="source-player-section">
            <label>吃碰家</label>
            <div class="source-player-buttons">
              <button 
                v-for="option in sourcePlayerOptions" 
                :key="option.value"
                type="button"
                :class="['source-player-btn', { active: meldForm.sourcePlayer === option.value }]"
                @click="meldForm.sourcePlayer = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <!-- Tile Selection Grid -->
          <div class="tile-selection-section">
            <label>
              选择牌张 
              <span class="selection-hint">
                ({{ meldForm.type === 'chi' ? '需要选择3张牌' : '只需选择1张牌' }})
              </span>
            </label>
            <div class="tile-grid">
              <div 
                v-for="option in treasureTileOptions" 
                :key="option.code"
                :class="['tile-option', { selected: isTileSelected(option.code) }]"
                @click="toggleTileSelection(option.code)"
              >
                <img :src="option.src" :alt="option.label" class="tile-image" />
                <span class="tile-label">{{ option.label }}</span>
              </div>
            </div>
          </div>

          <!-- Selected Tiles Preview -->
          <div v-if="meldForm.selectedTiles.length" class="selected-tiles-preview">
            <label>已选择的牌</label>
            <div class="selected-tiles">
              <div v-for="tileCode in meldForm.selectedTiles" :key="tileCode" class="selected-tile">
                <img :src="getTileImage(tileCode)" :alt="tileCode" class="selected-tile-image" />
                <span>{{ treasureTileOptions.find(opt => opt.code === tileCode)?.label }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="ghost" @click="showMeldModal = false">取消</button>
          <button class="primary" @click="saveMeld" :disabled="!meldForm.selectedTiles.length">保存副露</button>
        </div>
      </div>
    </div>

    <!-- Tenpai Modal -->
    <div v-if="showTenpaiModal" class="modal-overlay" @click="showTenpaiModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>配置听牌</h3>
          <button class="close-btn" @click="showTenpaiModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="grid two">
            <label>
              听牌状态
              <select v-model="tenpaiForm.status">
                <option value="tenpai">听牌</option>
                <option value="riichi">立直</option>
              </select>
            </label>
            <label class="checkbox-label">
              <input v-model="tenpaiForm.isFuriten" type="checkbox" />
              振听
            </label>
          </div>
          <div class="title-row">
            <span>听牌数组</span>
            <button type="button" class="ghost" @click="addTenpaiTile">+ 添加听牌</button>
          </div>
          <div class="tenpai-config-list">
            <div v-for="(tile, index) in tenpaiForm.tiles" :key="index" class="tenpai-config-item">
              <select v-model="tile.code" class="tile-select">
                <option value="">请选择牌</option>
                <option v-for="opt in treasureTileOptions" :key="opt.value" :value="opt.code">
                  {{ opt.label }}
                </option>
              </select>
              <select v-model="tile.status" class="status-select">
                <option value="yaku">有役</option>
                <option value="noyaku">无役</option>
              </select>
              <input 
                v-model.number="tile.count" 
                type="number" 
                min="1" 
                max="4" 
                placeholder="数量(可选)"
                class="count-input"
              />
              <div v-if="tile.code" class="tile-preview">
                <img :src="getTileImage(tile.code)" :alt="tile.code" class="preview-tile" />
              </div>
              <button type="button" class="ghost danger" @click="removeTenpaiTile(index)">移除</button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="ghost danger" @click="clearTenpai">清除听牌</button>
          <button class="ghost" @click="showTenpaiModal = false">取消</button>
          <button class="primary" @click="saveTenpai">保存听牌</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel-root {
  padding: 24px 28px 200px;
  font-family: '微软雅黑', 'Microsoft YaHei', 'Inter', sans-serif;
  color: #102035;
}

h1 {
  margin-bottom: 18px;
  font-size: 26px;
}

section {
  background: #ffffff;
  border-radius: 16px;
  padding: 18px 20px 12px;
  margin-bottom: 18px;
  box-shadow: 0 15px 30px rgba(15, 23, 42, 0.06);
  border: 1px solid rgba(15, 23, 42, 0.06);
}

h2 {
  margin: 0 0 12px;
  font-size: 18px;
  color: #0f172a;
}

h3 {
  margin: 0;
  font-size: 16px;
}

.grid {
  display: grid;
  gap: 14px;
}

.grid.one {
  grid-template-columns: 1fr;
}

.grid.two {
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.grid .full {
  grid-column: 1 / -1;
}

label {
  font-size: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #475569;
}

input,
textarea,
select {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  font-size: 14px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

textarea {
  resize: vertical;
}

.treasure-tile-selector {
  display: flex;
  gap: 12px;
  align-items: center;
}

.treasure-select {
  flex: 1;
}

.treasure-preview {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.treasure-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.treasure-tile-list {
  margin-top: 8px;
}

.treasure-tile-item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(15, 23, 42, 0.05);
}

.treasure-tile-item:last-child {
  border-bottom: none;
}

.treasure-tile-item .treasure-tile-selector {
  flex: 1;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tenpai-item {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(15, 23, 42, 0.05);
}

.tenpai-item:last-child {
  border-bottom: none;
}

.row {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.checkbox {
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.checkbox input {
  width: auto;
}

.tenpai-list {
  margin-top: 8px;
}

.players-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.player-config {
  flex: 1;
  min-width: 250px;
  padding: 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 8px;
  background: rgba(248, 250, 252, 0.5);
}

.player-config:first-of-type {
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.player-config header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.hint {
  margin: 0 0 8px;
  font-size: 13px;
  color: #94a3b8;
}

.empty-tip {
  padding: 6px 0 16px;
  color: #94a3b8;
  font-size: 14px;
}

button {
  border: none;
  cursor: pointer;
  font-size: 14px;
  border-radius: 999px;
  padding: 10px 18px;
  transition: transform 0.1s ease, box-shadow 0.2s ease;
}

button.ghost {
  background: transparent;
  border: 1px solid rgba(148, 163, 184, 0.6);
}

button.ghost:hover:not(:disabled) {
  border-color: #2563eb;
  color: #2563eb;
}

button.ghost.danger:hover:not(:disabled) {
  border-color: #ef4444;
  color: #ef4444;
}

.floating-submit {
  position: fixed;
  left: 24px;
  right: 24px;
  bottom: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 18px;
  padding: 16px 18px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
  border: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.button-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

button.primary {
  background: linear-gradient(120deg, #2563eb, #7c3aed);
  color: #fff;
  flex: 1;
  font-size: 16px;
  padding: 12px 20px;
}

button.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Toast 通知样式 */
.toast-notification {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  min-width: 300px;
  max-width: 500px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  animation: toastSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-notification.success {
  background: rgba(34, 197, 94, 0.95);
  color: white;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.toast-notification.error {
  background: rgba(239, 68, 68, 0.95);
  color: white;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.toast-notification.info {
  background: rgba(59, 130, 246, 0.95);
  color: white;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.toast-content {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 10px;
}

.toast-icon {
  font-size: 16px;
  font-weight: bold;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.toast-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.toast-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

@keyframes toastSlideIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

/* Meld and Tenpai Styles */
.meld-list, .tenpai-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.meld-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(59, 130, 246, 0.1);
}

.meld-preview {
  display: flex;
  gap: 4px;
  align-items: flex-end;
}

.meld-tile {
  width: 32px;
  height: 40px;
  object-fit: contain;
}

.meld-tile.horizontal {
  transform: rotate(-90deg);
  width: 40px;
  height: 32px;
}

.meld-tile.doublehorizontal {
  transform: rotate(-90deg);
  width: 40px;
  /* height: 32px; */
  object-fit: contain;
}

.meld-tile.backend {
  transform: rotate(180deg);
  width: 32px;
  height: 40px;
  object-fit: contain;
}

.horizontal-stack-preview {
  display: flex;
  flex-direction: column;
  gap: 1px;
  align-items: center;
}

.meld-preview span {
  display: inline-block;
}

.tenpai-status {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.tenpai {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-badge.riichi {
  background: #fef3c7;
  color: #d97706;
}

.furiten-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: #fee2e2;
  color: #dc2626;
}

.tenpai-tiles {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tenpai-tile-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.tenpai-tile {
  width: 32px;
  height: 40px;
  object-fit: contain;
}

.tile-status {
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 2px;
}

.tile-status.yaku {
  background: #dcfce7;
  color: #16a34a;
}

.tile-status.noyaku {
  background: #f3f4f6;
  color: #6b7280;
}

.tile-count {
  font-size: 10px;
  color: #6b7280;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #374151;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
}

.meld-config-list, .tenpai-config-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.meld-config-item, .tenpai-config-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.tile-select, .orientation-select, .status-select {
  flex: 1;
  min-width: 120px;
}

.count-input {
  width: 100px;
}

.tile-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
}

.preview-tile {
  width: 32px;
  height: 40px;
  object-fit: contain;
}

.preview-tile.horizontal {
  transform: rotate(-90deg);
  width: 40px;
  height: 32px;
}

.preview-tile.doublehorizontal {
  transform: rotate(-90deg);
  width: 40px;
  height: 40px;
  object-fit: contain;
}
.checkbox-label {
  flex-direction: row !important;
  align-items: center;
  gap: 8px;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
}

/* Meld Form Styles */
.meld-type-section, .source-player-section, .tile-selection-section, .selected-tiles-preview {
  margin-bottom: 20px;
}

.meld-type-buttons, .source-player-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.meld-type-btn, .source-player-btn {
  padding: 8px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.meld-type-btn:hover, .source-player-btn:hover {
  border-color: #3b82f6;
}

.meld-type-btn.active, .source-player-btn.active {
  border-color: #3b82f6;
  background: #3b82f6;
  color: white;
}

.tile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
  margin-top: 12px;
  max-height: 300px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.tile-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f9fafb;
}

.tile-option:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.tile-option.selected {
  border-color: #3b82f6;
  background: #dbeafe;
}

.tile-image {
  width: 32px;
  height: 40px;
  object-fit: contain;
}

.tile-label {
  font-size: 10px;
  text-align: center;
  color: #6b7280;
}

.selection-hint {
  font-size: 12px;
  color: #6b7280;
  font-weight: normal;
}

.selected-tiles {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.selected-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background: #dbeafe;
  border-radius: 8px;
  border: 1px solid #3b82f6;
}

.selected-tile-image {
  width: 24px;
  height: 30px;
  object-fit: contain;
}

.selected-tile span {
  font-size: 10px;
  color: #1d4ed8;
}

/* Image Input Styles */
.image-input-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-type-buttons {
  display: flex;
  gap: 4px;
}

.input-type-btn {
  padding: 4px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
}

.input-type-btn:hover {
  border-color: #3b82f6;
}

.input-type-btn.active {
  border-color: #3b82f6;
  background: #3b82f6;
  color: white;
}

.file-input {
  padding: 8px 0;
}

.image-preview {
  margin-top: 8px;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}

.preview-image {
  max-width: 200px;
  max-height: 100px;
  object-fit: contain;
  border-radius: 4px;
}

@media (max-width: 520px) {
  .grid.two {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .meld-config-item, .tenpai-config-item {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

