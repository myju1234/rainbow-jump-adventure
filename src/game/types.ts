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
  dashOn: boolean
  attackUntil: number
  shield: boolean
  bossHp: number
  /** 같은 공격 한 번으로 보스를 여러 번 때리지 않도록 쓰는 표식 */
  bossHitToken: number
  /** 지나온 마지막 체크포인트 번호. 아직 없으면 -1 */
  checkpointIndex: number
  /** 피격 직후 잠시 무적인 시간 */
  invulnUntil: number
  collected: string[]
  camera: number
  bounce: boolean
  crouching: boolean
  walking: boolean
}
