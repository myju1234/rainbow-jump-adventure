import { themes } from '../game/data'
import type { ThemeKey } from '../game/types'

type Props = {
  theme: ThemeKey
  canInstall: boolean
  installed: boolean
  onStart: () => void
  onStages: () => void
  onRecords: () => void
  onInstall: () => void
  onTheme: (theme: ThemeKey) => void
  onInstallApp: () => void
}

export function StartScreen({
  theme,
  canInstall,
  installed,
  onStart,
  onStages,
  onRecords,
  onInstall,
  onTheme,
  onInstallApp,
}: Props) {
  return (
    <main className="start-screen">
      <section className="hero-card" aria-label="게임 시작">
        <div className="hero-sky">
          <span>☁️</span>
          <span>🌈</span>
          <span>☁️</span>
        </div>
        <div className="hero-adventurer bunny-adventurer" aria-hidden="true">
          <span>🦊</span>
        </div>
        <p className="eyebrow">통통 뛰며 깃발까지!</p>
        <h1>{themes[theme].name}</h1>
        <p className="hero-copy">{themes[theme].subtitle}</p>
        <p className="play-hint">휴대폰에서는 모험이 시작되면 가로 화면으로 플레이해요.</p>
        {installed && <p className="install-badge">앱으로 실행 중</p>}
        <button className="primary-btn start-btn" onClick={onStart}>
          ▶ 모험 시작
        </button>
      </section>

      <section className="theme-panel" aria-labelledby="theme-title">
        <div>
          <p className="eyebrow">오늘의 분위기</p>
          <h2 id="theme-title">테마를 골라요</h2>
        </div>
        <div className="theme-grid">
          {(Object.keys(themes) as ThemeKey[]).map((key) => (
            <button
              key={key}
              onClick={() => onTheme(key)}
              className={`theme-choice ${theme === key ? 'selected' : ''} ${themes[key].className}`}
              aria-pressed={theme === key}
            >
              <span>{themes[key].emoji}</span>
              <strong>{themes[key].name}</strong>
              <small>{theme === key ? '선택됨' : '선택하기'}</small>
            </button>
          ))}
        </div>
      </section>

      <div className="home-actions">
        <button className="secondary-btn" onClick={onStages}>
          🗺️ 전체 15개 스테이지 보기
        </button>
        {canInstall && (
          <button className="secondary-btn install-btn" onClick={onInstallApp}>
            📲 지금 앱으로 설치
          </button>
        )}
        <button className="secondary-btn install-btn" onClick={onInstall}>
          📲 휴대폰에 설치하기
        </button>
        <button className="text-btn" onClick={onRecords}>
          🏆 나의 기록 보기
        </button>
      </div>
    </main>
  )
}
