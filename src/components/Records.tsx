import { themes } from '../game/data'
import type { ThemeKey } from '../game/types'

type Props = {
  highScore: number
  coins: number
  completed: number
  totalStages: number
  themeScores: Record<string, number>
  onBack: () => void
}

export function Records({ highScore, coins, completed, totalStages, themeScores, onBack }: Props) {
  return (
    <main className="page-shell">
      <header className="page-header">
        <button className="back-btn" onClick={onBack}>← 처음으로</button>
        <div>
          <p className="eyebrow">나의 발자국</p>
          <h1>모험 기록</h1>
        </div>
      </header>

      <section className="record-grid">
        <article>
          <span>🏆</span>
          <strong>{highScore.toLocaleString()}</strong>
          <small>최고 점수</small>
        </article>
        <article>
          <span>🪙</span>
          <strong>{coins.toLocaleString()}</strong>
          <small>누적 동전</small>
        </article>
        <article>
          <span>🚩</span>
          <strong>{completed} / {totalStages}</strong>
          <small>완료한 스테이지</small>
        </article>
      </section>

      <section className="theme-records">
        <h2>테마별 최고 기록</h2>
        {(Object.keys(themes) as ThemeKey[]).map((key) => (
          <div className="theme-record-row" key={key}>
            <span>{themes[key].emoji} {themes[key].name}</span>
            <strong>{(themeScores[key] || 0).toLocaleString()}점</strong>
          </div>
        ))}
      </section>
    </main>
  )
}
