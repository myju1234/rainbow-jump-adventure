import type { ItemType, Progress, Run, StageItem, ThemeKey } from './types'

export const STAGE_COUNT = 15
export const THEMES: ThemeKey[] = ['rainbow', 'forest', 'moon', 'dash']
export const GROUND_Y = 274
export const FALL_Y = 410
export const HERO_START_X = 80

export const themes: Record<ThemeKey, { name: string; subtitle: string; emoji: string; className: string }> = {
  rainbow: { name: '무지개 점프 대모험', subtitle: '파란 하늘을 달리는 알록달록 모험', emoji: '🌈', className: 'theme-rainbow' },
  forest: { name: '버섯숲 점프대', subtitle: '포근한 숲길에서 시작하는 통통 점프', emoji: '🍄', className: 'theme-forest' },
  moon: { name: '달빛 점프 원정대', subtitle: '별빛 성으로 향하는 신비한 질주', emoji: '🌙', className: 'theme-moon' },
  dash: { name: '점프 대시!', subtitle: '색깔 폭발! 시원하게 달리는 도전', emoji: '⚡', className: 'theme-dash' },
}

export const monsterIcons = ['👾', '👻', '🦇', '🧌', '🐲']

export const itemIcons: Record<Exclude<ItemType, 'enemy'>, string> = {
  coin: '🪙',
  star: '⭐',
  mushroom: '🍄',
  rock: '🪨',
  spike: '▲',
  crate: '▣',
  log: '━',
}

export const initialProgress = (): Progress => ({
  theme: 'rainbow',
  total_coins: 0,
  high_score: 0,
  current_stage: 1,
  completed_count: 0,
  stages: Array.from({ length: STAGE_COUNT }, (_, i) => ({
    stage_number: i + 1,
    completed: 0,
    best_score: 0,
  })),
  theme_scores: { rainbow: 0, forest: 0, moon: 0, dash: 0 },
})

export const makeRun = (lives = 3): Run => ({
  x: HERO_START_X,
  y: GROUND_Y,
  vy: 0,
  score: 0,
  coins: 0,
  lives,
  starUntil: 0,
  heartUntil: 0,
  growUntil: 0,
  dashUntil: 0,
  attackUntil: 0,
  shield: false,
  collected: [],
  camera: 0,
  bounce: false,
  crouching: false,
  walking: false,
})

export function iconFor(type: ItemType, id = '') {
  if (type === 'enemy') {
    const variant = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % monsterIcons.length
    return monsterIcons[variant]
  }
  return itemIcons[type]
}

export function difficultyOf(stageNo: number) {
  return Math.min(5, Math.ceil(stageNo / 3))
}

const coins = (start: number, count: number, step = 62, y = 255, tag = ''): StageItem[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `c-${tag}-${start}-${i}`,
    type: 'coin',
    x: start + i * step,
    y: y - (i % 2 ? 16 : 0),
  }))

const bonusRun = (stage: number, start: number): StageItem[] => [
  ...coins(start, 5, 64, 255, `s${stage}`),
  { id: `star-${stage}-${start}`, type: 'star', x: start + 410, y: 230 },
  ...coins(start + 510, 4, 65, 252, `s${stage}-b`),
  { id: `mush-${stage}-${start}`, type: 'mushroom', x: start + 835, y: 275 },
]

const patrol = (stage: number, length: number): StageItem => ({
  id: `patrol-monster-${stage}`,
  type: 'enemy',
  x: Math.round(length * 0.68),
  y: 288,
})

const withPatrol = (
  stage: {
    id: number
    name: string
    length: number
    gaps: Array<[number, number]>
    items: StageItem[]
  },
) => ({
  ...stage,
  items: [...stage.items, patrol(stage.id, stage.length)],
})

export const stages = [
  withPatrol({
    id: 1, name: '햇살 언덕', length: 3200,
    gaps: [[590, 710], [1280, 1400], [2210, 2350]],
    items: [...coins(260, 4), { id: 'mush1', type: 'mushroom', x: 470, y: 268 }, { id: 'star1', type: 'star', x: 810, y: 235 }, ...coins(910, 4), { id: 'spike1', type: 'spike', x: 1130, y: 294 }, ...coins(1480, 5), { id: 'enemy1', type: 'enemy', x: 1780, y: 288 }, ...coins(2430, 4), { id: 'rock1b', type: 'rock', x: 2730, y: 290 }, ...coins(2840, 4)],
  }),
  withPatrol({
    id: 2, name: '버섯 다리', length: 4100,
    gaps: [[440, 565], [1050, 1185], [1650, 1770], [2570, 2710], [3380, 3535]],
    items: [...coins(190, 3), { id: 'mush1', type: 'mushroom', x: 680, y: 275 }, ...coins(750, 5), { id: 'crate2', type: 'crate', x: 1300, y: 289 }, ...coins(1430, 4), { id: 'star2', type: 'star', x: 1920, y: 230 }, ...coins(2020, 4), { id: 'enemy2b', type: 'enemy', x: 2320, y: 288 }, ...coins(2790, 5), { id: 'log2', type: 'log', x: 3180, y: 291 }, ...coins(3630, 5)],
  }),
  withPatrol({
    id: 3, name: '바람 협곡', length: 5050,
    gaps: [[650, 800], [1210, 1325], [1830, 1965], [2730, 2880], [3710, 3875]],
    items: [...coins(240, 5), { id: 'rock3', type: 'rock', x: 980, y: 290 }, ...coins(1410, 5), { id: 'mush3', type: 'mushroom', x: 1610, y: 275 }, { id: 'enemy3', type: 'enemy', x: 2110, y: 288 }, ...coins(2210, 4), { id: 'spike3', type: 'spike', x: 2480, y: 294 }, ...coins(2970, 5), { id: 'star3', type: 'star', x: 3380, y: 230 }, { id: 'crate3', type: 'crate', x: 3530, y: 289 }, ...coins(4010, 6), { id: 'enemy3b', type: 'enemy', x: 4510, y: 288 }],
  }),
  withPatrol({
    id: 4, name: '별빛 벌판', length: 6050,
    gaps: [[500, 630], [1000, 1130], [1510, 1660], [2190, 2300], [3120, 3270], [4260, 4430], [5080, 5250]],
    items: [...coins(180, 4), { id: 'star4', type: 'star', x: 760, y: 220 }, ...coins(820, 3), { id: 'log4', type: 'log', x: 1300, y: 291 }, ...coins(1750, 5), { id: 'mush4', type: 'mushroom', x: 2040, y: 275 }, ...coins(2400, 4), { id: 'enemy4', type: 'enemy', x: 2800, y: 288 }, ...coins(3370, 5), { id: 'spike4', type: 'spike', x: 3930, y: 294 }, { id: 'star4b', type: 'star', x: 4630, y: 230 }, ...coins(4690, 5), { id: 'rock4', type: 'rock', x: 5480, y: 290 }],
  }),
  withPatrol({
    id: 5, name: '무지개 정상', length: 7200,
    gaps: [[560, 690], [1080, 1230], [1700, 1840], [2310, 2460], [3350, 3510], [4390, 4550], [5520, 5700]],
    items: [...coins(210, 4), { id: 'rock5', type: 'rock', x: 865, y: 290 }, { id: 'star5', type: 'star', x: 1420, y: 230 }, ...coins(1510, 4), { id: 'spike5', type: 'spike', x: 2010, y: 294 }, { id: 'mush5', type: 'mushroom', x: 2180, y: 275 }, ...coins(2580, 5), { id: 'enemy5', type: 'enemy', x: 3050, y: 288 }, ...coins(3600, 6), { id: 'crate5', type: 'crate', x: 4190, y: 289 }, { id: 'star5b', type: 'star', x: 4860, y: 230 }, ...coins(4950, 5), { id: 'log5', type: 'log', x: 5300, y: 291 }, ...coins(5790, 6), { id: 'enemy5b', type: 'enemy', x: 6510, y: 288 }],
  }),
  withPatrol({
    id: 6, name: '구름 미로', length: 8000,
    gaps: [[610, 750], [1430, 1570], [2500, 2660], [3720, 3870], [5100, 5260], [6630, 6790]],
    items: [...bonusRun(6, 230), { id: 'rock6', type: 'rock', x: 1100, y: 290 }, { id: 'enemy6', type: 'enemy', x: 1890, y: 288 }, ...bonusRun(6, 2850), { id: 'spike6', type: 'spike', x: 4420, y: 294 }, { id: 'crate6', type: 'crate', x: 5880, y: 289 }, ...coins(7000, 7, 64, 250, 's6-end')],
  }),
  withPatrol({
    id: 7, name: '반짝 샘물길', length: 8850,
    gaps: [[500, 645], [1160, 1305], [2070, 2235], [3240, 3390], [4520, 4690], [5970, 6130], [7440, 7610]],
    items: [...bonusRun(7, 180), { id: 'log7', type: 'log', x: 1240, y: 291 }, { id: 'enemy7', type: 'enemy', x: 1770, y: 288 }, ...bonusRun(7, 2730), { id: 'rock7', type: 'rock', x: 4250, y: 290 }, { id: 'spike7', type: 'spike', x: 5320, y: 294 }, ...bonusRun(7, 6350), { id: 'crate7', type: 'crate', x: 7980, y: 289 }],
  }),
  withPatrol({
    id: 8, name: '바람개비 고개', length: 9700,
    gaps: [[690, 840], [1510, 1650], [2420, 2590], [3500, 3660], [4800, 4970], [6220, 6380], [7590, 7760], [8690, 8860]],
    items: [...bonusRun(8, 250), { id: 'crate8', type: 'crate', x: 1320, y: 289 }, { id: 'enemy8', type: 'enemy', x: 2130, y: 288 }, ...bonusRun(8, 2950), { id: 'log8', type: 'log', x: 4080, y: 291 }, { id: 'spike8', type: 'spike', x: 5500, y: 294 }, ...bonusRun(8, 6650), { id: 'rock8', type: 'rock', x: 8250, y: 290 }, ...coins(9020, 6, 62, 250, 's8-end')],
  }),
  withPatrol({
    id: 9, name: '달무리 다리', length: 10600,
    gaps: [[560, 710], [1280, 1435], [2210, 2380], [3340, 3510], [4630, 4800], [6020, 6190], [7480, 7650], [8920, 9090]],
    items: [...bonusRun(9, 220), { id: 'mush9x', type: 'mushroom', x: 1180, y: 275 }, { id: 'enemy9', type: 'enemy', x: 1860, y: 288 }, ...bonusRun(9, 2700), { id: 'rock9', type: 'rock', x: 4300, y: 290 }, { id: 'crate9', type: 'crate', x: 5460, y: 289 }, ...bonusRun(9, 6550), { id: 'spike9', type: 'spike', x: 8210, y: 294 }, { id: 'enemy9b', type: 'enemy', x: 9630, y: 288 }],
  }),
  withPatrol({
    id: 10, name: '별가루 터널', length: 11500,
    gaps: [[620, 780], [1410, 1570], [2350, 2520], [3450, 3620], [4820, 5000], [6210, 6380], [7660, 7830], [9060, 9230], [10300, 10480]],
    items: [...bonusRun(10, 200), { id: 'spike10', type: 'spike', x: 1270, y: 294 }, { id: 'enemy10', type: 'enemy', x: 1960, y: 288 }, ...bonusRun(10, 2860), { id: 'log10', type: 'log', x: 4480, y: 291 }, { id: 'rock10', type: 'rock', x: 5680, y: 290 }, ...bonusRun(10, 6700), { id: 'crate10', type: 'crate', x: 8530, y: 289 }, { id: 'enemy10b', type: 'enemy', x: 9870, y: 288 }, ...coins(10650, 7, 62, 250, 's10-end')],
  }),
  withPatrol({
    id: 11, name: '무지개 급류', length: 12500,
    gaps: [[520, 680], [1150, 1310], [2050, 2230], [3130, 3310], [4400, 4580], [5840, 6020], [7320, 7500], [8810, 8990], [10300, 10480], [11370, 11550]],
    items: [...bonusRun(11, 180), { id: 'enemy11', type: 'enemy', x: 1050, y: 288 }, { id: 'rock11', type: 'rock', x: 1750, y: 290 }, ...bonusRun(11, 2700), { id: 'spike11', type: 'spike', x: 4110, y: 294 }, { id: 'crate11', type: 'crate', x: 5320, y: 289 }, ...bonusRun(11, 6500), { id: 'log11', type: 'log', x: 8240, y: 291 }, { id: 'enemy11b', type: 'enemy', x: 9680, y: 288 }, ...coins(11700, 8, 62, 250, 's11-end')],
  }),
  withPatrol({
    id: 12, name: '폭신 구름성', length: 13500,
    gaps: [[650, 820], [1490, 1650], [2460, 2640], [3600, 3780], [4960, 5140], [6410, 6590], [7890, 8070], [9320, 9510], [10850, 11030], [12120, 12300]],
    items: [...bonusRun(12, 240), { id: 'crate12', type: 'crate', x: 1290, y: 289 }, { id: 'enemy12', type: 'enemy', x: 2070, y: 288 }, ...bonusRun(12, 2940), { id: 'rock12', type: 'rock', x: 4660, y: 290 }, { id: 'spike12', type: 'spike', x: 5820, y: 294 }, ...bonusRun(12, 6800), { id: 'log12', type: 'log', x: 8560, y: 291 }, { id: 'enemy12b', type: 'enemy', x: 10170, y: 288 }, ...coins(12500, 9, 62, 250, 's12-end')],
  }),
  withPatrol({
    id: 13, name: '번개 절벽', length: 14600,
    gaps: [[580, 750], [1310, 1480], [2260, 2450], [3380, 3570], [4720, 4910], [6140, 6330], [7630, 7820], [9150, 9340], [10630, 10820], [11980, 12170], [13210, 13400]],
    items: [...bonusRun(13, 210), { id: 'spike13', type: 'spike', x: 1160, y: 294 }, { id: 'enemy13', type: 'enemy', x: 1910, y: 288 }, ...bonusRun(13, 2800), { id: 'crate13', type: 'crate', x: 4510, y: 289 }, { id: 'rock13', type: 'rock', x: 5600, y: 290 }, ...bonusRun(13, 6720), { id: 'log13', type: 'log', x: 8420, y: 291 }, { id: 'enemy13b', type: 'enemy', x: 10040, y: 288 }, ...bonusRun(13, 11100), { id: 'spike13b', type: 'spike', x: 12840, y: 294 }],
  }),
  withPatrol({
    id: 14, name: '별빛 회랑', length: 15800,
    gaps: [[640, 820], [1460, 1640], [2440, 2630], [3570, 3760], [4940, 5130], [6390, 6580], [7900, 8090], [9460, 9650], [11000, 11190], [12430, 12620], [13910, 14100]],
    items: [...bonusRun(14, 220), { id: 'rock14', type: 'rock', x: 1200, y: 290 }, { id: 'enemy14', type: 'enemy', x: 2040, y: 288 }, ...bonusRun(14, 2950), { id: 'spike14', type: 'spike', x: 4670, y: 294 }, { id: 'crate14', type: 'crate', x: 5750, y: 289 }, ...bonusRun(14, 6800), { id: 'log14', type: 'log', x: 8660, y: 291 }, { id: 'enemy14b', type: 'enemy', x: 10220, y: 288 }, ...bonusRun(14, 11400), { id: 'rock14b', type: 'rock', x: 14500, y: 290 }],
  }),
  withPatrol({
    id: 15, name: '찬란한 결승선', length: 17200,
    gaps: [[560, 750], [1260, 1450], [2200, 2400], [3330, 3530], [4680, 4880], [6120, 6320], [7620, 7820], [9200, 9400], [10800, 11000], [12380, 12580], [13920, 14120], [15350, 15550]],
    items: [...bonusRun(15, 190), { id: 'enemy15', type: 'enemy', x: 1110, y: 288 }, { id: 'spike15', type: 'spike', x: 1890, y: 294 }, ...bonusRun(15, 2750), { id: 'crate15', type: 'crate', x: 4460, y: 289 }, { id: 'rock15', type: 'rock', x: 5560, y: 290 }, ...bonusRun(15, 6750), { id: 'log15', type: 'log', x: 8500, y: 291 }, { id: 'enemy15b', type: 'enemy', x: 10090, y: 288 }, ...bonusRun(15, 11400), { id: 'spike15b', type: 'spike', x: 13600, y: 294 }, { id: 'crate15b', type: 'crate', x: 14980, y: 289 }, ...coins(16000, 10, 62, 250, 's15-end')],
  }),
]
