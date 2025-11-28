<script setup lang="ts">
import { reactive, ref, watch, onMounted } from 'vue'
import { useMatchState } from '../composables/useMatchState'
import { majiangScoreTable } from '../data/majiangScoreTable'
import type { MatchState, PlayerBoard, TenpaiOption, SeatWind, Meld, MeldTile, PlayerTenpai, TenpaiTile, TileOrientation, TenpaiStatus, TileStatus, MeldType, SourcePlayer } from '../types/match'

// 设置窗口标题
onMounted(() => {
  document.title = '花听直播-控制面板-madeby比尔'
})

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
  { label: '西', value: '西' },
  { label: '北', value: '北' },
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
const showWinModal = ref(false)
const currentPlayerId = ref<string>('')
const scoreTable = ref<any>(majiangScoreTable.dealerScoreTable)
const scoreType = ref<'ziMo' | 'rongHe'>('ziMo')
const winForm = reactive({
  scoreTable: scoreTable.value,
  scoreType: scoreType.value,
  scoreObject: null as PlayerBoard | null,
  selectedFan: '' as string,
  selectedFu: '' as string,
  scoreData: null as any,
})
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
const openTenpaiModal = (playerId: string, type: 'tenpai' | 'riichi' = 'tenpai') => {
  currentPlayerId.value = playerId
  const player = form.players.find(p => p.id === playerId)
  if (player?.tenpai) {
    Object.assign(tenpaiForm, player.tenpai)
    tenpaiForm.status = type
  } else {
    tenpaiForm.status = type
    tenpaiForm.isFuriten = false
    tenpaiForm.tiles = []
  }
  showTenpaiModal.value = true
}

// Win methods
const openWinModal = (playerId: string, playerIndex: number, type: 'ziMo' | 'rongHe' = 'ziMo') => {
  currentPlayerId.value = playerId
  if (currentRoundNum.value == playerIndex) {
    scoreTable.value = majiangScoreTable.dealerScoreTable
  } else {
    scoreTable.value = majiangScoreTable.playerScoreTable
  }
  scoreType.value = type
  winForm.scoreTable = scoreTable.value
  winForm.scoreType = type
  winForm.selectedFan = ''
  winForm.selectedFu = ''
  winForm.scoreData = null
  // 如果是荣和，初始化放铳对象为其他玩家
  if (type === 'rongHe') {
    winForm.scoreObject = form.players.find(p => p.id !== playerId) || null
  } else {
    winForm.scoreObject = null
  }
  showWinModal.value = true
}

// 获取可用的番数选项
const getFanOptions = () => {
  if (!winForm.scoreTable || !winForm.scoreTable.scoreData) return []
  return Object.keys(winForm.scoreTable.scoreData)
}

// 获取可用的符数选项
const getFuOptions = () => {
  if (!winForm.selectedFan || !winForm.scoreTable || !winForm.scoreTable.scoreData) return []
  const fanData = winForm.scoreTable.scoreData[winForm.selectedFan]
  if (!fanData || typeof fanData === 'string' || (fanData.type && !fanData.ron && !fanData.tsumo)) {
    return []
  }
  if (fanData.type) {
    // 特殊类型（满贯、跳满等），不需要符数
    return []
  }
  return Object.keys(fanData)
}

// 计算并显示分数
const calculateScore = () => {
  if (!winForm.selectedFan || !winForm.scoreTable || !winForm.scoreTable.scoreData) {
    winForm.scoreData = null
    return
  }
  
  const fanData = winForm.scoreTable.scoreData[winForm.selectedFan]
  
  // 处理特殊类型（满贯、跳满等）
  if (fanData.type) {
    winForm.scoreData = fanData
    return
  }
  
  // 处理需要符数的情况
  if (!winForm.selectedFu || !fanData[winForm.selectedFu]) {
    winForm.scoreData = null
    return
  }
  
  const fuData = fanData[winForm.selectedFu]
  
  // 处理特殊值（IM, RIM, TIM）
  if (typeof fuData === 'string') {
    winForm.scoreData = { special: fuData }
    return
  }
  
  winForm.scoreData = fuData
}

// 监听番数和符数变化
watch([() => winForm.selectedFan, () => winForm.selectedFu], () => {
  calculateScore()
})

const saveWin = () => {
  const winningPlayer = form.players.find(p => p.id === currentPlayerId.value)
  if (!winningPlayer) return
  
  // 验证必填项
  if (!winForm.selectedFan) {
    showToast('请选择番数', 'error')
    return
  }
  
  const fanData = winForm.scoreTable.scoreData[winForm.selectedFan]
  
  // 检查是否需要符数
  if (!fanData.type && !winForm.selectedFu) {
    showToast('请选择符数', 'error')
    return
  }
  
  // 如果是荣和，需要选择放铳对象
  if (scoreType.value === 'rongHe' && !winForm.scoreObject) {
    showToast('请选择放铳对象', 'error')
    return
  }
  
  // 计算分数
  calculateScore()
  if (!winForm.scoreData) {
    showToast('无法计算分数，请检查选择', 'error')
    return
  }
  
  // 处理特殊值
  if (winForm.scoreData.special) {
    showToast(`该组合不可行: ${winForm.scoreData.special}`, 'error')
    return
  }
  
  // 获取分数值
  const dealerIndex = currentRoundNum.value - 1
  const isWinningPlayerDealer = form.players[dealerIndex].id === currentPlayerId.value
  
  if (scoreType.value === 'ziMo') {
    // 自摸
    if (typeof winForm.scoreData.tsumo === 'number') {
      // 庄家分数表：每家付相同分数
      const scorePerPlayer = winForm.scoreData.tsumo
      form.players.forEach((player) => {
        if (player.id === currentPlayerId.value) {
          player.score += scorePerPlayer * 3
        } else {
          player.score -= scorePerPlayer
        }
      })
    } else if (winForm.scoreData.tsumo && typeof winForm.scoreData.tsumo === 'object') {
      // 闲家分数表：庄家和闲家付的分数不同
      const dealerScore = winForm.scoreData.tsumo.dealer
      const playerScore = winForm.scoreData.tsumo.player
      
      form.players.forEach((player, index) => {
        const isPlayerDealer = index === dealerIndex
        if (player.id === currentPlayerId.value) {
          // 和牌者得分
          if (isPlayerDealer) {
            // 庄家自摸，应该不会用闲家表，但以防万一
            player.score += dealerScore + playerScore * 2
          } else {
            // 闲家自摸
            player.score += dealerScore + playerScore * 2
          }
        } else {
          // 其他玩家付分
          if (isPlayerDealer) {
            player.score -= dealerScore
          } else {
            player.score -= playerScore
          }
        }
      })
    } else {
      showToast('该组合自摸不可行', 'error')
      return
    }
  } else {
    // 荣和
    if (!winForm.scoreObject) {
      showToast('请选择放铳对象', 'error')
      return
    }
    
    let ronScore: number
    if (typeof winForm.scoreData.ron === 'number') {
      ronScore = winForm.scoreData.ron
    } else if (typeof winForm.scoreData.ron === 'string') {
      showToast(`该组合荣和不可行: ${winForm.scoreData.ron}`, 'error')
      return
    } else {
      showToast('无法计算分数', 'error')
      return
    }
    
    // 荣和时，只有放铳者付分
    winningPlayer.score += ronScore
    winForm.scoreObject.score -= ronScore
  }
  
  // 本场和立直棒处理
  if (form.honba > 0) {
    const honbaScore = form.honba * 300
    if (scoreType.value === 'ziMo') {
      // 自摸时，每家付本场费
      form.players.forEach(player => {
        if (player.id === currentPlayerId.value) {
          player.score += honbaScore * 3
        } else {
          player.score -= honbaScore
        }
      })
    } else {
      // 荣和时，只有放铳者付本场费
      if (winForm.scoreObject) {
        winningPlayer.score += honbaScore
        winForm.scoreObject.score -= honbaScore
      }
    }
  }
  
  if (form.riichiSticks > 0) {
    const riichiScore = form.riichiSticks * 1000
    winningPlayer.score += riichiScore
    form.riichiSticks = 0
  }
  
  // 清除听牌状态
  form.players.forEach(player => {
    player.tenpai = null
    player.melds = []
  })
  
  
  // 判断是否连庄
  if (!isWinningPlayerDealer) {
    form.honba = 0
    // 庄家未和牌，进入下一局
    if (Number(form.currentRound) == 4) {
      currentRoundNum.value = 1
      const currentIndex = sessionOptions.findIndex(option => option.value === form.sessionLabel)
      if (currentIndex !== -1 && currentIndex + 1 < sessionOptions.length) {
        form.sessionLabel = sessionOptions[currentIndex + 1].value
      }
    } else {
      currentRoundNum.value = Number(form.currentRound) + 1
    }
  }else{
    // 庄家和牌，本场加一
    form.honba += 1
  }
  
  showWinModal.value = false
  showToast('和牌分数已更新', 'success')
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

const liuJu = () => {
  //本场加一
  form.honba += 1
  //判断听牌家
  let tenpaiCount = 0
  let dealerTenpai = false;
  form.players.forEach((player, index) => {
    console.log(player.tenpai)
    if (player.tenpai) {
      tenpaiCount += 1
      if (index + 1 == currentRoundNum.value) {
        dealerTenpai = true
      }
    }
  })
  if (!dealerTenpai) {
    
    if (currentRoundNum.value == 4) {
      currentRoundNum.value = 1
      // 使用sessionOptions的下一个值
      const currentIndex = sessionOptions.findIndex(option => option.value === form.sessionLabel)
      if (currentIndex !== -1 && currentIndex + 1 < sessionOptions.length) {
        form.sessionLabel = sessionOptions[currentIndex + 1].value
      }
      // 如果不存在下一个，保持不变，或自定义行为
    } else {
      currentRoundNum.value += 1
    }
}
 if (tenpaiCount == 0||tenpaiCount == 4) {
  //不涉及分数变化
 }else if (tenpaiCount == 1) {
  //未听牌家输1000
  form.players.forEach(player => {
    if (!player.tenpai) {
      player.score -= 1000
    }else{
      player.score += 3000
    }
  })
 }else if (tenpaiCount == 2) {
  //未听牌家输1500
  form.players.forEach(player => {
    if (!player.tenpai) {
      player.score -= 1500
    }else{
      player.score += 1500
    }
  })
 }else if (tenpaiCount == 3) {
  //未听牌家输3000
  form.players.forEach(player => {
    if (!player.tenpai) {
      player.score -= 3000
    }else{
      player.score += 1000
    }
  })
 }
 //清除听牌状态
 form.players.forEach(player => {
  player.tenpai = null
  player.melds = []
 })
}

const saveTenpai = () => {
  const player = form.players.find(p => p.id === currentPlayerId.value)
  if (player) {
    if (tenpaiForm.status === 'riichi' && (!player.tenpai || player.tenpai.status !== 'riichi')) {
      player.score -= 1000
      form.riichiSticks += 1
    }
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
      <div class="player-config-container">
        <button type="button" class="ghost" @click="liuJu()">流局</button>
      </div>
      <div v-if="!form.players.length" class="empty-tip">尚未添加战队。</div>
      <div class="players-row">
        <article v-for="(player, index) in form.players" :key="player.id" class="player-config">
          <div class="player-config-container">
          {{ currentRoundNum == index + 1 ? '亲' : '子' }}
          <button type="button" class="ghost" @click="openWinModal(player.id, index + 1, 'ziMo')">自摸</button>
          <button type="button" class="ghost" @click="openWinModal(player.id, index + 1, 'rongHe')">荣和</button>
          <button type="button" class="ghost" @click="openTenpaiModal(player.id, 'riichi')">立直</button>
        </div>
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
              <button type="button" class="ghost" @click="openTenpaiModal(player.id, 'tenpai')">配置听牌</button>
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
              <select v-model="tenpaiForm.status" disabled>
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

    <!-- Win Modal -->
    <div v-if="showWinModal" class="modal-overlay" @click="showWinModal = false">
      <div class="modal-content win-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ scoreType == 'ziMo' ? '自摸' : '荣和' }}</h3>
          <button class="close-btn" @click="showWinModal = false">×</button>
        </div>
        <div class="modal-body">
          <!-- 放铳对象选择（仅荣和时显示） -->
          <div v-if="scoreType == 'rongHe'" class="score-section">
            <label>
              选择放铳对象
              <select v-model="winForm.scoreObject" class="score-select">
                <option :value="null">请选择放铳对象</option>
                <option 
                  v-for="player in form.players.filter(p => p.id !== currentPlayerId)" 
                  :key="player.id" 
                  :value="player"
                >
                  {{ player.badgeText || player.playerName }}
                </option>
              </select>
            </label>
          </div>
          
          <!-- 番数选择 -->
          <div class="score-section">
            <label>
              选择番数
              <select v-model="winForm.selectedFan" class="score-select">
                <option value="">请选择番数</option>
                <option v-for="fan in getFanOptions()" :key="fan" :value="fan">
                  {{ fan }}
                </option>
              </select>
            </label>
          </div>
          
          <!-- 符数选择（仅在需要时显示） -->
          <div v-if="winForm.selectedFan && getFuOptions().length > 0" class="score-section">
            <label>
              选择符数
              <select v-model="winForm.selectedFu" class="score-select">
                <option value="">请选择符数</option>
                <option v-for="fu in getFuOptions()" :key="fu" :value="fu">
                  {{ fu }}
                </option>
              </select>
            </label>
          </div>
          
          <!-- 分数显示 -->
          <div v-if="winForm.scoreData" class="score-display">
            <div class="score-result">
              <div class="score-label">和牌分数：</div>
              <div class="score-value">
                <template v-if="winForm.scoreData.special">
                  <span class="special-score">{{ winForm.scoreData.special }}</span>
                </template>
                <template v-else-if="winForm.scoreData.type">
                  <span class="score-type">{{ winForm.scoreData.type }}</span>
                  <div class="score-details">
                    <div v-if="scoreType === 'ziMo'">
                      <span>自摸：</span>
                      <span v-if="typeof winForm.scoreData.tsumo === 'number'">
                        {{ winForm.scoreData.tsumo }} × 3 = {{ winForm.scoreData.tsumo * 3 }}点
                      </span>
                      <span v-else-if="winForm.scoreData.tsumo && typeof winForm.scoreData.tsumo === 'object'">
                        庄家 {{ winForm.scoreData.tsumo.dealer }}点，闲家 {{ winForm.scoreData.tsumo.player }}点 × 2
                      </span>
                    </div>
                    <div v-else>
                      <span>荣和：{{ winForm.scoreData.ron }}点</span>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="score-details">
                    <div v-if="scoreType === 'ziMo'">
                      <span>自摸：</span>
                      <span v-if="typeof winForm.scoreData.tsumo === 'number'">
                        {{ winForm.scoreData.tsumo }} × 3 = {{ winForm.scoreData.tsumo * 3 }}点
                      </span>
                      <span v-else-if="winForm.scoreData.tsumo && typeof winForm.scoreData.tsumo === 'object'">
                        庄家 {{ winForm.scoreData.tsumo.dealer }}点，闲家 {{ winForm.scoreData.tsumo.player }}点 × 2
                      </span>
                      <span v-else-if="typeof winForm.scoreData.tsumo === 'string'">
                        {{ winForm.scoreData.tsumo }}
                      </span>
                    </div>
                    <div v-else>
                      <span>荣和：</span>
                      <span v-if="typeof winForm.scoreData.ron === 'number'">
                        {{ winForm.scoreData.ron }}点
                      </span>
                      <span v-else>
                        {{ winForm.scoreData.ron }}
                      </span>
                    </div>
                  </div>
                </template>
              </div>
            </div>
            <div v-if="form.honba > 0" class="bonus-info">
              本场：{{ form.honba }}本场 × 300 = {{ form.honba * 300 }}点
            </div>
            <div v-if="form.riichiSticks > 0" class="bonus-info">
              立直棒：{{ form.riichiSticks }}本 × 1000 = {{ form.riichiSticks * 1000 }}点
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="ghost" @click="showWinModal = false">取消</button>
          <button class="primary" @click="saveWin" :disabled="!winForm.selectedFan || (getFuOptions().length > 0 && !winForm.selectedFu) || (scoreType === 'rongHe' && !winForm.scoreObject)">保存</button>
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

/* Win Modal Styles */
.win-modal {
  max-width: 700px;
}

.score-section {
  margin-bottom: 20px;
}

.score-section label {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.score-select {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  font-size: 14px;
  background: white;
}

.score-display {
  margin-top: 24px;
  padding: 16px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 12px;
  border: 2px solid #3b82f6;
}

.score-result {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.score-label {
  font-size: 16px;
  font-weight: 600;
  color: #1e40af;
}

.score-value {
  flex: 1;
  font-size: 18px;
  font-weight: 700;
  color: #1e40af;
}

.score-type {
  display: inline-block;
  padding: 4px 12px;
  background: #3b82f6;
  color: white;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  margin-right: 12px;
}

.score-details {
  margin-top: 8px;
  font-size: 14px;
  color: #1e40af;
  line-height: 1.6;
}

.special-score {
  color: #dc2626;
  font-weight: 600;
  font-size: 16px;
}

.bonus-info {
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 6px;
  font-size: 13px;
  color: #1e40af;
}

.player-config-container {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
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
  
  .score-result {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

