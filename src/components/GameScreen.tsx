import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BOSS_BLOCK,
  BOSS_HIT_DAMAGE,
  BOSS_MAX_HP,
  BOSS_REACH,
  bossBeatAt,
  bossFor,
  bossOf,
  checkpointsOf,
  difficultyOf,
  GROUND_Y,
  HERO_START_X,
  iconFor,
  makeRun,
  respawnRun,
  stages,
} from '../game/data'
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
  onContinue: () => void
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
  onContinue,
  needsRotate,
}: Props) {
  const stage = stages[stageNo - 1]
  const difficultyLevel = difficultyOf(stageNo)
  const enemyWobble = 34 + stageNo * 2
  const enemyTempo = Math.max(150, 260 - stageNo * 7)
  const boss = useMemo(() => bossOf(stage), [stage])
  const bossInfo = useMemo(() => bossFor(stageNo), [stageNo])
  const checkpoints = useMemo(() => checkpointsOf(stage), [stage])
  const [run, setRun] = useState<Run>(() => makeRun())
  const [now, setNow] = useState(() => performance.now())
  const keys = useRef({ left: false, right: false, down: false })
  const runRef = useRef(run)
  const finishing = useRef(false)
  const bossAnnounced = useRef(false)
  /** 보스전이 시작된 시각. 여기서부터 보스의 공격 주기를 셉니다. */
  const bossFightStart = useRef<number | null>(null)
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
    bossAnnounced.current = false
    bossFightStart.current = null
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

  const respawnX = useCallback(
    (index: number) => (index >= 0 ? checkpoints[index] : HERO_START_X),
    [checkpoints],
  )

  const hit = useCallback(() => {
    const curr = runRef.current
    if (curr.shield) {
      onNoticeRef.current('🛡️ 보호막이 충돌을 막았어요!')
      setRun((prev) => ({ ...prev, shield: false, x: Math.max(80, prev.x - 55) }))
      return
    }
    const lives = curr.lives - 1
    const backTo = respawnX(curr.checkpointIndex)
    // 보스 방 밖으로 되돌아갔다면 다시 들어올 때 등장 안내를 한 번 더 보여줍니다.
    bossAnnounced.current = backTo >= boss.gateX
    bossFightStart.current = null
    setRun(respawnRun(curr, Math.max(0, lives), backTo))
    if (lives <= 0) {
      onFailRef.current()
    } else if (curr.checkpointIndex >= 0) {
      onNoticeRef.current(`앗! 목숨 ${lives}개 · 체크포인트 ${curr.checkpointIndex + 1}에서 다시!`)
    } else {
      onNoticeRef.current(`앗! 목숨이 ${lives}개 남았어요.`)
    }
  }, [boss.gateX, respawnX])

  const continueFromCheckpoint = useCallback(() => {
    const curr = runRef.current
    const backTo = respawnX(curr.checkpointIndex)
    bossAnnounced.current = backTo >= boss.gateX
    bossFightStart.current = null
    finishing.current = false
    setRun(respawnRun(curr, 3, backTo))
    onContinue()
  }, [boss.gateX, onContinue, respawnX])

  const dash = useCallback(() => {
    if (frozen || result) return
    const turningOn = !runRef.current.dashOn
    setRun((prev) => ({ ...prev, dashOn: turningOn, crouching: false }))
    onNoticeRef.current(turningOn ? '💨 대시 켜짐! 한 번 더 누르면 꺼져요.' : '🐾 대시 꺼짐')
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
      // 키를 누르고 있어도 대시가 계속 켜졌다 꺼지지 않도록 첫 입력만 받습니다.
      if ((event.key === 'm' || event.key === 'M') && !event.repeat) dash()
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
      const dashing = prev.dashOn
      const bossAlive = prev.bossHp > 0
      const bossX = boss.x + Math.sin(time / 520) * boss.patrol
      const direction = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0)
      const speed =
        direction *
        ((155 + difficultyLevel * 7) * (boosted ? 1.65 : 1) * (dashing ? 2.15 : 1)) *
        (keys.current.down ? 0.58 : 1)
      let nx = Math.max(15, prev.x + speed * dt)
      // 보스가 길을 막습니다. 부딪히는 것만으로는 다치지 않고 그 앞에서 멈춥니다.
      if (bossAlive) nx = Math.min(nx, bossX - BOSS_BLOCK)
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

      let reached = next.checkpointIndex
      for (let i = checkpoints.length - 1; i > next.checkpointIndex; i -= 1) {
        if (nx >= checkpoints[i]) {
          reached = i
          break
        }
      }
      if (reached > next.checkpointIndex) {
        next = { ...next, checkpointIndex: reached }
        onNoticeRef.current(`⛳ 체크포인트 ${reached + 1}! 여기서 다시 시작해요.`)
      }

      if (bossAlive && nx >= boss.gateX && bossFightStart.current === null) {
        bossFightStart.current = time
        if (!bossAnnounced.current) {
          bossAnnounced.current = true
          onNoticeRef.current(`⚔️ ${bossInfo.icon} ${bossInfo.name} 등장! N으로 10번 공격, 충격파는 점프로!`)
        }
      }

      if (bossAlive) {
        const swinging = next.attackUntil > time
        const inReach = Math.abs(nx - bossX) < BOSS_REACH && Math.abs(ny - boss.y) < 96
        if (inReach && swinging && next.bossHitToken !== next.attackUntil) {
          const bossHp = Math.max(0, next.bossHp - BOSS_HIT_DAMAGE)
          next = {
            ...next,
            bossHp,
            bossHitToken: next.attackUntil,
            score: next.score + (bossHp <= 0 ? 1000 : 60),
          }
          onNoticeRef.current(
            bossHp <= 0
              ? `🏆 ${bossInfo.name}을(를) 물리쳤어요! +1000`
              : `💥 명중! 보스 체력 ${bossHp}/${BOSS_MAX_HP}`,
          )
        }

        // 충격파는 땅으로 퍼집니다. 점프해 있으면 그대로 지나갑니다.
        const beat = bossFightStart.current === null ? null : bossBeatAt(time - bossFightStart.current)
        if (beat?.phase === 'wave' && next.invulnUntil <= time) {
          const waveX = bossX - beat.waveOffset
          const standing = ny >= GROUND_Y - 46
          if (standing && Math.abs(nx - waveX) < 46) {
            if (next.shield) {
              next = { ...next, shield: false, invulnUntil: time + 1400 }
              onNoticeRef.current('🛡️ 보호막이 충격파를 막았어요!')
            } else if (next.lives <= 1) {
              hit()
              frame = requestAnimationFrame(tick)
              return
            } else {
              nx = Math.max(15, nx - 130)
              next = {
                ...next,
                x: nx,
                vy: -320,
                lives: next.lives - 1,
                invulnUntil: time + 1500,
                camera: Math.max(0, nx - 270),
              }
              onNoticeRef.current(`💥 충격파! 목숨 ${next.lives}개 · 다음엔 점프로 피해요`)
            }
          }
        }
      }

      if (nx >= stage.length - 120 && next.bossHp <= 0) {
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
  }, [boss, bossInfo, checkpoints, difficultyLevel, enemyTempo, enemyWobble, frozen, hit, result, stage])

  const setHeld = (side: HeldKey, value: boolean) => {
    keys.current[side] = value
  }

  const heroClass = [
    'hero bunny-hero',
    run.walking ? 'walking' : '',
    run.starUntil > now ? 'boosted' : '',
    run.growUntil > now ? 'grown' : '',
    run.dashOn ? 'dashing' : '',
    run.attackUntil > now ? 'attacking' : '',
    run.shield ? 'shielded' : '',
    run.crouching ? 'crouching' : '',
    run.invulnUntil > now ? 'invuln' : '',
  ].filter(Boolean).join(' ')

  const bossAlive = run.bossHp > 0
  const bossEngaged = bossAlive && run.x >= boss.gateX
  const bossX = boss.x + Math.sin(now / 520) * boss.patrol
  const bossBeat =
    bossAlive && bossFightStart.current !== null ? bossBeatAt(now - bossFightStart.current) : null
  const bossInReach = bossAlive && Math.abs(run.x - bossX) < BOSS_REACH
  const bossStruck = bossAlive && run.bossHitToken > now
  const attacking = run.attackUntil > now
  const bossClass = ['boss', bossInReach ? 'in-reach' : '', bossStruck ? 'struck' : '', bossBeat ? bossBeat.phase : '']
    .filter(Boolean)
    .join(' ')

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
        <div className="checkpoint-status">
          <small>체크포인트</small>
          <strong>
            {run.checkpointIndex >= 0
              ? `⛳ ${run.checkpointIndex + 1} / ${checkpoints.length}`
              : `🏳️ 0 / ${checkpoints.length}`}
          </strong>
        </div>
        <div className="hud-extra dash-guide">
          <small>대시</small>
          <strong>{run.dashOn ? '💨 켜짐 (M 끄기)' : 'M 키로 켜기'}</strong>
        </div>
        <div className="hud-extra dash-guide">
          <small>공격</small>
          <strong>{run.attackUntil > now ? '✨ 공격 중!' : 'N 키 · 공격'}</strong>
        </div>
        {bossEngaged && (
          <div className="hud-boss">
            <small>{bossInfo.icon} {bossInfo.name}</small>
            <div className="boss-hp">
              <i style={{ width: `${(run.bossHp / BOSS_MAX_HP) * 100}%` }} />
              <b>{run.bossHp} / {BOSS_MAX_HP}</b>
            </div>
          </div>
        )}
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
            {checkpoints.map((cx, index) => {
              const reached = index <= run.checkpointIndex
              return (
                <div
                  key={cx}
                  className={reached ? 'checkpoint reached' : 'checkpoint'}
                  style={{ left: cx, top: 236 }}
                >
                  <span aria-hidden="true">{reached ? '⛳' : '🏳️'}</span>
                  <small>{reached ? `체크포인트 ${index + 1}` : '체크포인트'}</small>
                </div>
              )
            })}
            {bossAlive && (
              <div className={bossClass} style={{ left: bossX, top: boss.y }}>
                <div className="boss-hp">
                  <i style={{ width: `${(run.bossHp / BOSS_MAX_HP) * 100}%` }} />
                </div>
                <span className="boss-face" aria-hidden="true">{bossInfo.icon}</span>
                <small>{bossInfo.name}</small>
                {bossStruck && <b className="boss-damage">-{BOSS_HIT_DAMAGE}</b>}
                {bossBeat?.phase === 'ready' && <em className="boss-warn">점프 준비!</em>}
              </div>
            )}
            {bossBeat?.phase === 'wave' && (
              <div className="shockwave" style={{ left: bossX - bossBeat.waveOffset, top: 290 }}>
                <span aria-hidden="true">💥</span>
              </div>
            )}
            <div className={bossAlive ? 'flag locked' : 'flag'} style={{ left: stage.length - 90, top: 194 }}>
              <span>{bossAlive ? '🔒' : '🚩'}</span>
              <small>{bossAlive ? '보스를 물리쳐요' : '도착!'}</small>
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
              {attacking && <span className="claw" aria-hidden="true" />}
              <span aria-hidden="true">🦊</span>
            </div>
          </div>
        </div>
        <div className="stage-sign">
          STAGE {stage.id} · {stage.name} · 난이도 {'●'.repeat(difficultyLevel)}{'○'.repeat(5 - difficultyLevel)}
        </div>
        <div className="attack-hint" aria-label="공격 조작 안내">
          <kbd>N</kbd>
          <span>{bossEngaged ? '공격 · 💥 충격파는 점프로 피해요' : '공격 · 적을 물리쳐요'}</span>
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
          <button
            className={run.dashOn ? 'dash-control dash-on' : 'dash-control'}
            aria-label="대시 켜기 끄기"
            aria-pressed={run.dashOn}
            onPointerDown={dash}
          >
            M<small>{run.dashOn ? '대시 끄기' : '대시 켜기'}</small>
          </button>
          <button
            className={attacking ? 'attack-control swinging' : 'attack-control'}
            aria-label="N 키 공격"
            onPointerDown={attack}
          >
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
                <p>
                  {run.checkpointIndex >= 0
                    ? `체크포인트 ${run.checkpointIndex + 1}까지 왔어요. 거기서 이어서 달릴까요?`
                    : '목숨을 모두 썼지만, 모험가는 포기하지 않아요.'}
                </p>
                {run.checkpointIndex >= 0 && (
                  <button className="primary-btn" onClick={continueFromCheckpoint}>
                    ⛳ 체크포인트 {run.checkpointIndex + 1}에서 이어하기
                  </button>
                )}
                <button
                  className={run.checkpointIndex >= 0 ? 'secondary-btn' : 'primary-btn'}
                  onClick={onRetry}
                >
                  처음부터 다시
                </button>
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
