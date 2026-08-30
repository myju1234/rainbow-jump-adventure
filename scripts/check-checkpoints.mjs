// 체크포인트가 낭떠러지 위나 보스 사정거리 안에 놓이지 않는지 검사합니다.
// 사용법: node scripts/check-checkpoints.mjs
const CHECKPOINT_SPACING = 1400

const stageShapes = [
  [3200, [[590, 710], [1280, 1400], [2210, 2350]]],
  [4100, [[440, 565], [1050, 1185], [1650, 1770], [2570, 2710], [3380, 3535]]],
  [5050, [[650, 800], [1210, 1325], [1830, 1965], [2730, 2880], [3710, 3875]]],
  [6050, [[500, 630], [1000, 1130], [1510, 1660], [2190, 2300], [3120, 3270], [4260, 4430], [5080, 5250]]],
  [7200, [[560, 690], [1080, 1230], [1700, 1840], [2310, 2460], [3350, 3510], [4390, 4550], [5520, 5700]]],
  [8000, [[610, 750], [1430, 1570], [2500, 2660], [3720, 3870], [5100, 5260], [6630, 6790]]],
  [8850, [[500, 645], [1160, 1305], [2070, 2235], [3240, 3390], [4520, 4690], [5970, 6130], [7440, 7610]]],
  [9700, [[690, 840], [1510, 1650], [2420, 2590], [3500, 3660], [4800, 4970], [6220, 6380], [7590, 7760], [8690, 8860]]],
  [10600, [[560, 710], [1280, 1435], [2210, 2380], [3340, 3510], [4630, 4800], [6020, 6190], [7480, 7650], [8920, 9090]]],
  [11500, [[620, 780], [1410, 1570], [2350, 2520], [3450, 3620], [4820, 5000], [6210, 6380], [7660, 7830], [9060, 9230], [10300, 10480]]],
  [12500, [[520, 680], [1150, 1310], [2050, 2230], [3130, 3310], [4400, 4580], [5840, 6020], [7320, 7500], [8810, 8990], [10300, 10480], [11370, 11550]]],
  [13500, [[650, 820], [1490, 1650], [2460, 2640], [3600, 3780], [4960, 5140], [6410, 6590], [7890, 8070], [9320, 9510], [10850, 11030], [12120, 12300]]],
  [14600, [[580, 750], [1310, 1480], [2260, 2450], [3380, 3570], [4720, 4910], [6140, 6330], [7630, 7820], [9150, 9340], [10630, 10820], [11980, 12170], [13210, 13400]]],
  [15800, [[640, 820], [1460, 1640], [2440, 2630], [3570, 3760], [4940, 5130], [6390, 6580], [7900, 8090], [9460, 9650], [11000, 11190], [12430, 12620], [13910, 14100]]],
  [17200, [[560, 750], [1260, 1450], [2200, 2400], [3330, 3530], [4680, 4880], [6120, 6320], [7620, 7820], [9200, 9400], [10800, 11000], [12380, 12580], [13920, 14120], [15350, 15550]]],
]

const bossOf = (length) => ({ x: length - 250, gateX: length - 640, patrol: 38 })

function safeGround(x, gaps) {
  let safe = x
  for (const [start, end] of gaps) {
    if (safe > start - 80 && safe < end + 80) safe = end + 80
  }
  return Math.round(safe)
}

function checkpointsOf(length, gaps) {
  const boss = bossOf(length)
  const spots = []
  for (let x = CHECKPOINT_SPACING; x < boss.gateX - 300; x += CHECKPOINT_SPACING) {
    spots.push(safeGround(x, gaps))
  }
  spots.push(safeGround(boss.x - 330, gaps))
  return spots.reduce((kept, x) => {
    if (kept.length === 0 || x - kept[kept.length - 1] > 260) kept.push(x)
    return kept
  }, [])
}

let problems = 0
stageShapes.forEach(([length, gaps], i) => {
  const boss = bossOf(length)
  const spots = checkpointsOf(length, gaps)
  const inGap = spots.filter((x) => gaps.some(([a, b]) => x > a - 40 && x < b + 40))
  const tooCloseToBoss = spots.filter((x) => x > boss.x - boss.patrol - 100)
  const beyondFlag = spots.filter((x) => x > length - 120)
  if (inGap.length || tooCloseToBoss.length || beyondFlag.length) problems += 1
  console.log(
    `스테이지 ${String(i + 1).padStart(2)} · 길이 ${String(length).padStart(5)} · 보스 ${boss.x} · ` +
      `체크포인트 ${spots.length}개 [${spots.join(', ')}]` +
      (inGap.length ? ` ⚠ 낭떠러지: ${inGap}` : '') +
      (tooCloseToBoss.length ? ` ⚠ 보스와 겹침: ${tooCloseToBoss}` : '') +
      (beyondFlag.length ? ` ⚠ 깃발 뒤: ${beyondFlag}` : ''),
  )
})
console.log(problems === 0 ? '\n모든 스테이지 정상' : `\n문제 있는 스테이지 ${problems}개`)
