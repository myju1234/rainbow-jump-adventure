import { useCallback, useEffect, useRef, useState } from 'react'
import { difficultyOf, GROUND_Y, iconFor, makeRun, stages } from '../game/data'
import type { Result, Run } from '../game/types'

const WORLD_DESIGN_HEIGHT = 380

type HeldKey = 'left' | 'right' | 'down'

type Props = {
  stageNo: number
  paused: boolean
  result: Result
  notice: string
  onPauseToggle: () => void
  onNotice: (message: string) => void
  onFail: () => void
  onComplete: (run: Run) => void
  onRetry: () => void
  onNext: () => void
  onStages: () => void
  onResume: () => void
  needsRotate: boolean
}

export function GameScreen({
  stageNo,
  paused,
  result,
  notice,
  onPauseToggle,
  onNotice,
  onFail,
  onComplete,
  onRetry,
  onNext,
  onStages,
  onResume,
  needsRotate,
}: Props) {
  const stage = stages[stageNo - 1]
  const difficultyLevel = difficultyOf(stageNo)
  const enemyWobble = 34 + stageNo * 2
  const enemyTempo = Math.max(150, 260 - stageNo * 7)
  const [run, setRun] = useState<Run>(() => makeRun())
  const [now, setNow] = useState(() => performance.now())
  const keys = useRef({ left: false, right: false, down: false })
  const runRef = useRef(run)
  const finishing = useRef(false)
  const worldRef = useRef<HTMLElement>(null)
  const [worldScale, setWorldScale] = useState(1)
  const frozen = paused || needsRotate
  const onNoticeRef = useRef(onNotice)
  const onCompleteRef = useRef(onComplete)
  const onFailRef = useRef(onFail)

  useEffect(() => { onNoticeRef.current = onNotice }, [onNotice])
  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])
  useEffect(() => { onFailRef.current = onFail }, [onFail])

  useEffect(() => {
    runRef.current = run
  }, [run])

  useEffect(() => {
    setRun(makeRun())
    finishing.current = false
  }, [stageNo])

  useEffect(() => {
    const el = worldRef.current
    if (!el) return
    const apply = () => {
      setWorldScale(Math.min(1, Math.max(0.55, el.clientHeight / WORLD_DESIGN_HEIGHT)))
    }
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const jump = useCallback(() => {
    setRun((prev) =>
      prev.y >= GROUND_Y - 2 && !frozen && !result
        ? { ...prev, vy: -790, bounce: true, crouching: false }
        : prev,
    )
  }, [frozen, result])

  const hit = useCallback(() => {
    const curr = runRef.current
    if (curr.shield) {
      onNoticeRef.current('🛡️ 보호막이 충돌을 막았어요!')
      setRun((prev) => ({ ...prev, shield: false, x: Math.max(80, prev.x - 55) }))
      return
    }
    const lives = curr.lives - 1
    if (lives <= 0) {
      setRun({ ...makeRun(0), lives: 0 })
      onFailRef.current()
    } else {
      onNoticeRef.current(`앗! 목숨이 ${lives}개 남았어요.`)
      setRun(makeRun(lives))
    }
  }, [])

  const dash = useCallback(() => {
    if (frozen || result) return
    const t = performance.now()
    setRun((prev) => (prev.dashUntil > t + 100 ? prev : { ...prev, dashUntil: t + 650, crouching: false }))
    onNoticeRef.current('💨 대시!')
  }, [frozen, result])

  const attack = useCallback(() => {
    if (frozen || result) return
    const t = performance.now()
    setRun((prev) => ({ ...prev, attackUntil: t + 360, crouching: false }))
    onNoticeRef.current('✨ 공격! 적을 가까이에서 물리쳐요.')
  }, [frozen, result])

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'm', 'M', 'n', 'N'].includes(event.key)) {
        event.preventDefault()
      }
      if (event.key === 'ArrowLeft') keys.current.left = true
      if (event.key === 'ArrowRight') keys.current.right = true
      if (event.key === 'ArrowDown') keys.current.down = true
      if (event.key === 'ArrowUp' || event.key === ' ') jump()
      if (event.key === 'm' || event.key === 'M') dash()
      if (event.key === 'n' || event.key === 'N') attack()
    }
    const up = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') keys.current.left = false
      if (event.key === 'ArrowRight') keys.current.right = false
      if (event.key === 'ArrowDown') keys.current.down = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [attack, dash, jump])

  useEffect(() => {
    if (frozen || result) return
    let frame = 0
    let last = performance.now()

    const tick = (time: number) => {
      const dt = Math.min((time - last) / 1000, 0.04)
      last = time
      setNow(time)
      const prev = runRef.current
      const boosted = prev.starUntil > time
      const dashing = prev.dashUntil > time
      const direction = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0)
      const speed =
        direction *
        ((155 + difficultyLevel * 7) * (boosted ? 1.65 : 1) * (dashing ? 2.15 : 1)) *
        (keys.current.down ? 0.58 : 1)
      let nx = Math.max(15, prev.x + speed * dt)
      let ny = prev.y + prev.vy * dt
      let nvy = prev.vy + (1550 + difficultyLevel * 55) * dt
      const gapMargin = difficultyLevel * 5
      const overGap = stage.gaps.some(([a, b]) => nx + 16 > a - gapMargin && nx - 16 < b + gapMargin)
      if (ny >= GROUND_Y && !overGap) {
        ny = GROUND_Y
        nvy = 0
      }
      if (ny > 410) {
        hit()
        frame = requestAnimationFrame(tick)
        return
      }

      let next: Run = {
        ...prev,
        x: nx,
        y: ny,
        vy: nvy,
        camera: Math.max(0, nx - 270),
        bounce: false,
        crouching: keys.current.down && ny >= GROUND_Y - 2,
        walking: direction !== 0 && ny >= GROUND_Y - 2,
      }

      for (const item of stage.items) {
        if (next.collected.includes(item.id)) continue
        const ix = item.x + (item.type === 'enemy' ? Math.sin(time / enemyTempo + item.x) * enemyWobble : 0)
        const hitPadX = 30 + difficultyLevel * 2
        const hitPadY = 43 + difficultyLevel * 2
        if (Math.abs(nx - ix) < hitPadX && Math.abs(ny - item.y) < hitPadY) {
          if (item.type === 'coin') {
            next = { ...next, score: next.score + 100, coins: next.coins + 1, collected: [...next.collected, item.id] }
            onNoticeRef.current('+100 ✨')
          } else if (item.type === 'star') {
            next = { ...next, score: next.score + 250, starUntil: time + 6500, collected: [...next.collected, item.id] }
            onNoticeRef.current('⭐ 스피드 스타!')
          } else if (item.type === 'mushroom') {
            const nextLives = Math.min(3, next.lives + 1)
            next = {
              ...next,
              score: next.score + 150,
              lives: nextLives,
              heartUntil: time + 1100,
              growUntil: time + 7000,
              shield: true,
              collected: [...next.collected, item.id],
            }
            onNoticeRef.current(nextLives > prev.lives ? '🍄 커지며 목숨이 회복됐어요!' : '🍄 몸이 커졌어요! 보호막 획득!')
          } else if (item.type === 'enemy' && next.attackUntil > time) {
            next = { ...next, score: next.score + 300, collected: [...next.collected, item.id] }
            onNoticeRef.current('✨ 적을 물리쳤어요! +300')
          } else {
            hit()
            frame = requestAnimationFrame(tick)
            return
          }
        }
      }

      if (nx >= stage.length - 120) {
        if (!finishing.current) {
          finishing.current = true
          setRun(next)
          onCompleteRef.current(next)
        }
        return
      }

      setRun(next)
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [difficultyLevel, enemyTempo, enemyWobble, frozen, hit, result, stage])

  const setHeld = (side: HeldKey, value: boolean) => {
    keys.current[side] = value
  }

  const heroClass = [
    'hero bunny-hero',
    run.walking ? 'walking' : '',
    run.starUntil > now ? 'boosted' : '',
    run.growUntil > now ? 'grown' : '',
    run.dashUntil > now ? 'dashing' : '',
    run.attackUntil > now ? 'attacking' : '',
    run.shield ? 'shielded' : '',
    run.crouching ? 'crouching' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className="game-layout">
      {needsRotate && (
        <div className="rotate-gate" role="dialog" aria-label="가로 화면 안내">
          <span className="big-icon">📱</span>
          <h1>가로로 돌려 주세요</h1>
          <p>모험은 휴대폰을 가로로 들고 플레이해요.</p>
        </div>
      )}

      <header className="hud">
        <div>
          <small>점수</small>
          <strong>{run.score.toLocaleString()}</strong>
        </div>
        <div>
          <small>동전</small>
          <strong>🪙 {run.coins}</strong>
        </div>
        <div className={run.heartUntil > now ? 'heart-status heart-grow' : 'heart-status'}>
          <small>목숨</small>
          <strong>
            {'❤'.repeat(Math.max(0, run.lives))}
            <i>{'♡'.repeat(Math.max(0, 3 - run.lives))}</i>
          </strong>
        </div>
        <div className={`hud-extra ${run.growUntil > now ? 'mushroom-status active' : 'mushroom-status'}`}>
          <small>버섯 효과</small>
          <strong>{run.growUntil > now ? '🍄 커지는 중!' : '🍄 먹으면 커져요'}</strong>
        </div>
        <div className="hud-extra dash-guide">
          <small>대시</small>
          <strong>{run.dashUntil > now ? '💨 질주!' : 'M 키'}</strong>
        </div>
        <div className="hud-extra dash-guide">
          <small>공격</small>
          <strong>{run.attackUntil > now ? '✨ 공격 중!' : 'N 키 · 공격'}</strong>
        </div>
        <button className="pause-btn" onClick={onPauseToggle}>
          {paused ? '▶ 계속' : 'Ⅱ 일시정지'}
        </button>
      </header>

      <main ref={worldRef} className="game-world" aria-label={`${stage.name} 게임 화면`}>
        <div
          className="world-fit"
          style={{
            height: WORLD_DESIGN_HEIGHT,
            width: `${100 / worldScale}%`,
            transform: `scale(${worldScale})`,
          }}
        >
          <div className="cloud c1">☁️</div>
          <div className="cloud c2">☁️</div>
          <div className="castle">🏰</div>
          <div className="world" style={{ width: stage.length, transform: `translateX(${-run.camera}px)` }}>
            <div className="ground" />
            {stage.gaps.map((gap, i) => (
              <div className="gap" key={i} style={{ left: gap[0], width: gap[1] - gap[0] }}>✦</div>
            ))}
            {stage.items
              .filter((item) => !run.collected.includes(item.id))
              .map((item) => (
                <div
                  key={item.id}
                  className={`world-item ${item.type}`}
                  style={{
                    left: item.x + (item.type === 'enemy' ? Math.sin(now / enemyTempo + item.x) * enemyWobble : 0),
                    top: item.y,
                  }}
                >
                  {iconFor(item.type, item.id)}
                </div>
              ))}
            <div className="flag" style={{ left: stage.length - 90, top: 194 }}>
              <span>🚩</span>
              <small>도착!</small>
            </div>
            <div
              className={heroClass}
              style={{
                left: run.x,
                top: run.y,
                transform: `translate(-50%, -50%) ${run.bounce ? 'scale(1.08,.92)' : ''}`,
              }}
            >
              <span className="sparkle">✦</span>
              <span aria-hidden="true">🦊</span>
            </div>
          </div>
        </div>
        <div className="stage-sign">
          STAGE {stage.id} · {stage.name} · 난이도 {'●'.repeat(difficultyLevel)}{'○'.repeat(5 - difficultyLevel)}
        </div>
        <div className="attack-hint" aria-label="공격 조작 안내">
          <kbd>N</kbd>
          <span>공격 · 적을 물리쳐요</span>
        </div>
      </main>

      <div className="controls-bar" aria-label="게임 조작" onContextMenu={(event) => event.preventDefault()}>
        <div className="controls controls-move">
          <button className="left-control" aria-label="왼쪽 이동" onPointerDown={() => setHeld('left', true)} onPointerUp={() => setHeld('left', false)} onPointerCancel={() => setHeld('left', false)} onPointerLeave={() => setHeld('left', false)}>
            ◀<small>왼쪽</small>
          </button>
          <button className="down-control" aria-label="앉기" onPointerDown={() => setHeld('down', true)} onPointerUp={() => setHeld('down', false)} onPointerCancel={() => setHeld('down', false)} onPointerLeave={() => setHeld('down', false)}>
            ▼<small>앉기</small>
          </button>
          <button className="right-control" aria-label="오른쪽 이동" onPointerDown={() => setHeld('right', true)} onPointerUp={() => setHeld('right', false)} onPointerCancel={() => setHeld('right', false)} onPointerLeave={() => setHeld('right', false)}>
            ▶<small>오른쪽</small>
          </button>
        </div>
        <div className="controls controls-action">
          <button className="up-control" aria-label="점프" onPointerDown={jump}>
            ▲<small>점프</small>
          </button>
          <button className="dash-control" aria-label="대시" onPointerDown={dash}>
            M<small>대시</small>
          </button>
          <button className="attack-control" aria-label="N 키 공격" onPointerDown={attack}>
            <b>N</b><small>공격</small>
          </button>
        </div>
      </div>

      {(paused || result) && !needsRotate && (
        <div className="overlay">
          <section className="modal">
            {result === 'complete' ? (
              <>
                <span className="big-icon">🎉</span>
                <p className="eyebrow">깃발에 도착했어요!</p>
                <h1>스테이지 완료!</h1>
                <div className="result-stats">
                  <span>점수 <b>{run.score}</b></span>
                  <span>동전 <b>🪙 {run.coins}</b></span>
                  <span>남은 목숨 <b>❤ {run.lives}</b></span>
                </div>
                <button className="primary-btn" onClick={onNext}>
                  {stageNo < stages.length ? '다음 스테이지 →' : '모험 지도 보기'}
                </button>
                <button className="text-btn" onClick={onStages}>스테이지 선택</button>
              </>
            ) : result === 'failed' ? (
              <>
                <span className="big-icon">💫</span>
                <h1>다시 도전해요!</h1>
                <p>목숨을 모두 썼지만, 모험가는 포기하지 않아요.</p>
                <button className="primary-btn" onClick={onRetry}>처음부터 다시</button>
                <button className="text-btn" onClick={onStages}>스테이지 선택</button>
              </>
            ) : (
              <>
                <span className="big-icon">⏸</span>
                <h1>잠시 쉬는 중</h1>
                <p>준비되면 다시 통통 뛰어볼까요?</p>
                <button className="primary-btn" onClick={onResume}>계속 모험하기</button>
                <button className="text-btn" onClick={onStages}>스테이지 선택</button>
              </>
            )}
          </section>
        </div>
      )}

      {notice && !needsRotate && <div className="toast game-toast">{notice}</div>}
    </div>
  )
}
