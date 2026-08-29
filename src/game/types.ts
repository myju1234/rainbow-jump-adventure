export type ThemeKey = 'rainbow' | 'forest' | 'moon' | 'dash'
export type ItemType = 'coin' | 'star' | 'mushroom' | 'enemy' | 'rock' | 'spike' | 'crate' | 'log'
export type View = 'start' | 'stages' | 'game' | 'records' | 'install'
export type Result = 'complete' | 'failed' | null

export type StageItem = {
  id: string
  type: ItemType
  x: number
  y: number
}

export type StageData = {
  id: number
  name: string
  length: number
  gaps: Array<[number, number]>
  items: StageItem[]
}

export type ProgressStage = {
  stage_number: number
  completed: number
  best_score: number
}

export type Progress = {
  theme: ThemeKey
  total_coins: number
  high_score: number
  current_stage: number
  completed_count: number
  stages: ProgressStage[]
  theme_scores: Record<string, number>
}

export type Run = {
  x: number
  y: number
  vy: number
  score: number
  coins: number
  lives: number
  starUntil: number
  heartUntil: number
  growUntil: number
  dashUntil: number
  attackUntil: number
  shield: boolean
  collected: string[]
  camera: number
  bounce: boolean
  crouching: boolean
  walking: boolean
}
