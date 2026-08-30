import { useCallback, useEffect, useState } from 'react'
import { completeStage, loadProgress, saveCurrentStage, saveTheme } from './lib/progress'
import { useInstallPrompt } from './lib/useInstallPrompt'
import { useGameOrientation } from './lib/useGameOrientation'
import { initialProgress, stages, themes } from './game/data'
import type { Progress, Result, Run, ThemeKey, View } from './game/types'
import { StartScreen } from './components/StartScreen'
import { StageSelect } from './components/StageSelect'
import { Records } from './components/Records'
import { InstallGuide } from './components/InstallGuide'
import { GameScreen } from './components/GameScreen'

export default function App() {
  const [view, setView] = useState<View>('start')
  const [progress, setProgress] = useState<Progress>(initialProgress)
  const [theme, setTheme] = useState<ThemeKey>('rainbow')
  const [stageNo, setStageNo] = useState(1)
  const [paused, setPaused] = useState(false)
  const [result, setResult] = useState<Result>(null)
  const [notice, setNotice] = useState('')
  const [gameKey, setGameKey] = useState(0)
  const { canInstall, installed, install } = useInstallPrompt()
  const { needsRotate } = useGameOrientation(view === 'game')

  useEffect(() => {
    loadProgress().then((data) => {
      setProgress(data)
      setTheme(data.theme)
    }).catch(() => {
      setNotice('기록을 불러오지 못했어요. 이번 모험은 계속 즐길 수 있어요.')
    })
  }, [])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 2200)
    return () => window.clearTimeout(timer)
  }, [notice])

  const startStage = async (number: number) => {
    setStageNo(number)
    setResult(null)
    setPaused(false)
    setGameKey((key) => key + 1)
    setView('game')
    await saveCurrentStage(number)
  }

  const changeTheme = async (next: ThemeKey) => {
    setTheme(next)
    await saveTheme(next)
  }

  const onComplete = useCallback(async (finalRun: Run) => {
    setPaused(true)
    setResult('complete')
    try {
      const next = await completeStage({
        stage: stageNo,
        score: finalRun.score,
        coins: finalRun.coins,
        lives: finalRun.lives,
        theme,
      })
      setProgress(next)
    } catch {
      setNotice('이번 완료 기록은 화면에서만 확인할 수 있어요.')
    }
  }, [stageNo, theme])

  const installApp = async () => {
    const ok = await install()
    setNotice(ok ? '홈 화면에 앱이 추가됐어요!' : '브라우저 메뉴에서 홈 화면에 추가해 주세요.')
  }

  const shellClass = `app ${view === 'game' ? 'game-app' : ''} ${themes[theme].className}`

  return (
    <div className={shellClass}>
      {view === 'start' && (
        <StartScreen
          theme={theme}
          canInstall={canInstall}
          installed={installed}
          onTheme={changeTheme}
          onStart={() => startStage(Math.max(1, progress.current_stage))}
          onStages={() => setView('stages')}
          onRecords={() => setView('records')}
          onInstall={() => setView('install')}
          onInstallApp={installApp}
        />
      )}
      {view === 'stages' && (
        <StageSelect
          stages={stages}
          progress={progress.stages}
          onSelect={startStage}
          onBack={() => setView('start')}
        />
      )}
      {view === 'records' && (
        <Records
          highScore={progress.high_score}
          coins={progress.total_coins}
          completed={progress.completed_count}
          totalStages={stages.length}
          themeScores={progress.theme_scores}
          onBack={() => setView('start')}
        />
      )}
      {view === 'install' && (
        <InstallGuide
          canInstall={canInstall}
          installed={installed}
          onBack={() => setView('start')}
          onInstallApp={installApp}
        />
      )}
      {view === 'game' && (
        <GameScreen
          key={gameKey}
          stageNo={stageNo}
          paused={paused}
          result={result}
          notice={notice}
          onPauseToggle={() => setPaused((value) => !value)}
          onNotice={setNotice}
          onFail={() => setResult('failed')}
          onComplete={onComplete}
          onRetry={() => {
            setResult(null)
            setPaused(false)
            setGameKey((key) => key + 1)
          }}
          onNext={() => (stageNo < stages.length ? startStage(stageNo + 1) : setView('stages'))}
          onStages={() => setView('stages')}
          onResume={() => setPaused(false)}
          onContinue={() => {
            setResult(null)
            setPaused(false)
          }}
          needsRotate={needsRotate}
        />
      )}
      {notice && view !== 'game' && <div className="toast">{notice}</div>}
    </div>
  )
}
