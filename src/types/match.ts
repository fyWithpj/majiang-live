export type SeatWind = 'east' | 'south' | 'west' | 'north'
export type TileOrientation = 'vertical' | 'horizontal' | 'doublehorizontal' | 'backend'
export type TenpaiStatus = 'tenpai' | 'riichi'
export type TileStatus = 'yaku' | 'noyaku'
export type MeldType = 'chi' | 'pon' | 'minkan' | 'kakan' | 'ankan'
export type SourcePlayer = 'kamicha' | 'toimen' | 'shimocha'

export interface MeldTile {
  code: string
  orientation: TileOrientation
}

export interface Meld {
  id: string
  type: MeldType
  tiles: MeldTile[]
  sourcePlayer?: SourcePlayer // Only for chi, pon, minkan, kakan
}

export interface TenpaiTile {
  code: string
  status: TileStatus
  count?: number
}

export interface PlayerTenpai {
  status: TenpaiStatus
  isFuriten: boolean
  tiles: TenpaiTile[]
}

export interface TenpaiOption {
  label: string
  ready: boolean
  tiles?: string[]
}

export interface PlayerBoard {
  id: string
  badgeText: string
  badgeColor: string
  playerName: string
  teamName: string
  teamLogoUrl: string
  tagline: string
  score: number
  ptPoint: string
  wind: SeatWind
  highlight: boolean
  melds: Meld[]
  tenpai: PlayerTenpai | null
}

export interface MatchState {
  sessionLabel: string
  currentRound: string
  matchNumber: number
  fieldSupply: string
  treasureTile: string[]
  matchName: string
  matchLogoUrl: string
  subtitle: string
  honba: number
  riichiSticks: number
  players: PlayerBoard[]
}

export const defaultMatchState: MatchState = {
  "sessionLabel": "东",
  "currentRound": "1",
  "matchNumber": 0,
  "fieldSupply": "200",
  "treasureTile": [
      "p5.png"
  ],
  "matchName": "团队联赛",
  "matchLogoUrl": "https://q8.itc.cn/images01/20241022/cc4b10e6d3334352a05fae4b715a0582.png",
  "subtitle": "2025.11.23",
  "honba": 0,
  "riichiSticks": 0,
  "players": [
      {
          "id": "p1",
          "badgeText": "歪歪",
          "badgeColor": "#6dd400",
          "playerName": "歪歪",
          "teamName": "云南某某",
          "teamLogoUrl": "https://q8.itc.cn/images01/20241022/cc4b10e6d3334352a05fae4b715a0582.png",
          "tagline": "立直",
          "score": 200,
          "ptPoint": "100",
          "wind": "east",
          "highlight": false,
          "melds": [],
          "tenpai": null
      },
      {
          "id": "p2",
          "badgeText": "封不觉",
          "badgeColor": "#f472b6",
          "playerName": "封不觉",
          "teamName": "魔法少女",
          "teamLogoUrl": "https://q8.itc.cn/images01/20241022/cc4b10e6d3334352a05fae4b715a0582.png",
          "tagline": "攻守自如",
          "score": 37100,
          "ptPoint": "100",
          "wind": "south",
          "highlight": true,
          "melds": [
              {
                  "id": "m1",
                  "type": "chi",
                  "tiles": [
                      {
                          "code": "m1",
                          "orientation": "horizontal"
                      },
                      {
                          "code": "m2",
                          "orientation": "vertical"
                      },
                      {
                          "code": "m3",
                          "orientation": "vertical"
                      }
                  ],
                  "sourcePlayer": "kamicha"
              },
              {
                  "id": "m2",
                  "type": "pon",
                  "tiles": [
                      {
                          "code": "m4",
                          "orientation": "horizontal"
                      },
                      {
                          "code": "m4",
                          "orientation": "vertical"
                      },
                      {
                          "code": "m4",
                          "orientation": "vertical"
                      }
                  ],
                  "sourcePlayer": "toimen"
              },
              {
                  "id": "1764135666842",
                  "type": "kakan",
                  "tiles": [
                      {
                          "code": "p5",
                          "orientation": "vertical"
                      },
                      {
                          "code": "p5",
                          "orientation": "doublehorizontal"
                      },
                      {
                          "code": "p5",
                          "orientation": "vertical"
                      }
                  ],
                  "sourcePlayer": "toimen"
              }
          ],
          "tenpai": {
              "status": "tenpai",
              "isFuriten": false,
              "tiles": [
                  {
                      "code": "m1",
                      "status": "yaku",
                      "count": 1
                  }
              ]
          }
      },
      {
          "id": "p3",
          "badgeText": "OPSARA",
          "badgeColor": "#60a5fa",
          "playerName": "OPSARA",
          "teamName": "雪风 REVOLUTION",
          "teamLogoUrl": "https://q8.itc.cn/images01/20241022/cc4b10e6d3334352a05fae4b715a0582.png",
          "tagline": "OPSARA",
          "score": 9900,
          "ptPoint": "100",
          "wind": "west",
          "highlight": false,
          "melds": [],
          "tenpai": null
      },
      {
          "id": "p4",
          "badgeText": "梦远",
          "badgeColor": "#f59e0b",
          "playerName": "梦远",
          "teamName": "齐柏林未潜艇",
          "teamLogoUrl": "https://q8.itc.cn/images01/20241022/cc4b10e6d3334352a05fae4b715a0582.png",
          "tagline": "梦想起航",
          "score": 51800,
          "ptPoint": "100",
          "wind": "north",
          "highlight": false,
          "melds": [],
          "tenpai": null
      }
  ]
}


