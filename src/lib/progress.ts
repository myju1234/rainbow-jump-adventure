import { initialProgress, STAGE_COUNT, THEMES } from '../game/data'
import type { Progress, ThemeKey } from '../game/types'

const STORAGE_KEY = 'rainbow-jump-progress-v1'

function api(path: string, init?: RequestInit) {
  return fetch(`${import.meta.env.BASE_URL}api/${path.replace(/^\/+/, '')}`, init)
}

function readLocal(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialProgress()
    const parsed = JSON.parse(raw) as Partial<Progress>
    const base = initialProgress()
    return {
      ...base,
      ...parsed,
      stages: base.stages.map((stage) => {
        const saved = parsed.stages?.find((s) => s.stage_number === stage.stage_number)
        return saved ?? stage
      }),
      theme_scores: { ...base.theme_scores, ...parsed.theme_scores },
    }
  } catch {
    return initialProgress()
  }
}

function writeLocal(progress: Progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export async function loadProgress(): Promise<Progress> {
  try {
    const response = await api('progress')
    if (response.ok) {
      const remote = (await response.json()) as Progress
      writeLocal(remote)
      return remote
    }
  } catch {
    /* 서버가 없어도 로컬 기록으로 계속 진행합니다. */
  }
  return readLocal()
}

export async function saveTheme(theme: ThemeKey): Promise<void> {
  const progress = { ...readLocal(), theme }
  writeLocal(progress)
  try {
    await api('settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme }),
    })
  } catch {
    /* 로컬 저장만으로도 충분합니다. */
  }
}

export async function saveCurrentStage(stage: number): Promise<void> {
  const progress = { ...readLocal(), current_stage: stage }
  writeLocal(progress)
  try {
    await api('game-state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_stage: stage }),
    })
  } catch {
    /* 로컬 저장만으로도 충분합니다. */
  }
}

export async function completeStage(input: {
  stage: number
  score: number
  coins: number
  lives: number
  theme: ThemeKey
}): Promise<Progress> {
  try {
    const response = await api('complete-stage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (response.ok) {
      const remote = (await response.json()) as Progress
      writeLocal(remote)
      return remote
    }
  } catch {
    /* 서버가 없으면 아래 로컬 기록으로 저장합니다. */
  }

  const prev = readLocal()
  const stage = Math.max(1, Math.min(STAGE_COUNT, input.stage))
  const theme = THEMES.includes(input.theme) ? input.theme : 'rainbow'
  const score = Math.max(0, input.score)
  const coins = Math.max(0, input.coins)
  const stages = prev.stages.map((item) =>
    item.stage_number === stage
      ? { ...item, completed: 1, best_score: Math.max(item.best_score, score) }
      : item,
  )
  const next: Progress = {
    ...prev,
    theme,
    total_coins: prev.total_coins + coins,
    high_score: Math.max(prev.high_score, score),
    current_stage: Math.min(STAGE_COUNT, stage + 1),
    stages,
    completed_count: stages.filter((item) => item.completed).length,
    theme_scores: {
      ...prev.theme_scores,
      [theme]: Math.max(prev.theme_scores[theme] ?? 0, score),
    },
  }
  writeLocal(next)
  return next
}
