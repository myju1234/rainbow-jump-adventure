import { difficultyOf } from '../game/data'
import type { ProgressStage, StageData } from '../game/types'

type Props = {
  stages: StageData[]
  progress: ProgressStage[]
  onSelect: (stage: number) => void
  onBack: () => void
}

export function StageSelect({ stages: stageList, progress, onSelect, onBack }: Props) {
  const completedCount = progress.filter((stage) => stage.completed).length
  const openUntil = Math.min(stageList.length, 1 + completedCount)

  return (
    <main className="page-shell">
      <header className="page-header">
        <button className="back-btn" onClick={onBack}>← 처음으로</button>
        <div>
          <p className="eyebrow">모험 지도 · 총 {stageList.length}개 스테이지</p>
          <h1>어디로 떠날까요?</h1>
        </div>
      </header>

      <section className="stage-overview" aria-label="스테이지 목록 안내">
        <strong>🎮 새로 준비된 모험 스테이지</strong>
        <span>
          총 {stageList.length}개 · 완료 {completedCount}개 · 다음 목표 {Math.min(openUntil, stageList.length)}번
        </span>
      </section>

      <section className="stage-route" aria-label={`총 ${stageList.length}개 스테이지 목록`}>
        {stageList.map((stage, index) => {
          const state = progress.find((item) => item.stage_number === stage.id)
          const isOpen = stage.id <= openUntil
          const complete = Boolean(state?.completed)
          const difficulty = difficultyOf(stage.id)
          return (
            <article className={`stage-node ${complete ? 'done' : ''} ${isOpen ? 'open' : 'locked'}`} key={stage.id}>
              {index > 0 && <span className="route-line" />}
              <div className="node-orb">{complete ? '✓' : isOpen ? stage.id : '🔒'}</div>
              <div className="stage-info">
                <p>{complete ? '완료!' : isOpen ? '도전 가능' : '아직 잠김'}</p>
                <h2>{stage.id}. {stage.name}</h2>
                <small>난이도 {'●'.repeat(difficulty)}{'○'.repeat(5 - difficulty)}</small>
                {complete && <small>최고 점수 {state?.best_score.toLocaleString()}점</small>}
                <button
                  disabled={!isOpen}
                  className={isOpen ? 'primary-btn compact' : 'disabled-btn'}
                  onClick={() => onSelect(stage.id)}
                >
                  {complete ? '다시 달리기' : '도전하기'}
                </button>
              </div>
            </article>
          )
        })}
      </section>
    </main>
  )
}
