/**
 * 아이콘 파일이 모두 제자리에 있고 크기도 맞는지 검사합니다.
 *
 * make-icons.ps1은 파일 인코딩이 어긋나면 앞부분이 조용히 실행되지 않고 넘어갑니다.
 * 실제로 그 일이 한 번 일어나 안드로이드 아이콘만 바뀌고 Expo·PWA 아이콘은
 * 만들어지지 않은 채 빌드될 뻔했습니다. 그때 아무 오류도 나지 않았던 게 문제라서,
 * 인코딩 함정이 없는 Node로 결과물을 따로 검사합니다.
 *
 * 사용법: node scripts/verify-icons.mjs
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

/** 아이콘을 다시 만들 때 쓰는 원본 */
const sources = ['assets/icon-source.png', 'assets/icon-source-maskable.png']

/** [경로, 한 변의 픽셀 수] */
const expected = [
  ['assets/icon.png', 1024],
  ['assets/adaptive-icon.png', 1024],
  ['assets/splash-icon.png', 1024],
  ['assets/images/icon.png', 1024],
  ['assets/images/android-icon-foreground.png', 1024],
  ['assets/images/splash-icon.png', 1024],
  ['public/icons/icon-192.png', 192],
  ['public/icons/icon-512.png', 512],
  ['public/icons/icon-maskable-512.png', 512],
  ['public/icons/apple-touch-icon.png', 180],
  ['public/favicon.png', 64],
]

const launcher = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 }
const foreground = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 }
for (const [dpi, size] of Object.entries(launcher)) {
  const dir = `android/app/src/main/res/mipmap-${dpi}`
  expected.push([`${dir}/ic_launcher.png`, size])
  expected.push([`${dir}/ic_launcher_round.png`, size])
  expected.push([`${dir}/ic_launcher_foreground.png`, foreground[dpi]])
}

const problems = []

/** PNG 헤더만 읽어 가로·세로를 알아냅니다. 별도 라이브러리가 필요 없습니다. */
async function readPngSize(relative) {
  let buf
  try {
    buf = await readFile(path.join(root, relative))
  } catch {
    problems.push(`${relative} — 파일이 없습니다. scripts/make-icons.ps1을 다시 실행해 주세요.`)
    return null
  }
  if (buf.length < 24 || !buf.subarray(0, 8).equals(PNG_SIGNATURE)) {
    problems.push(`${relative} — PNG 파일이 아닙니다.`)
    return null
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

for (const relative of sources) {
  await readPngSize(relative)
}

for (const [relative, size] of expected) {
  const found = await readPngSize(relative)
  if (found && (found.width !== size || found.height !== size)) {
    problems.push(`${relative} — ${size}x${size}여야 하는데 ${found.width}x${found.height}입니다.`)
  }
}

// 설정 파일이 가리키는 아이콘이 실제로 있는지 함께 확인합니다.
// 없는 파일을 가리키면 Expo 빌드가 그때서야 실패합니다.
const appJson = JSON.parse(await readFile(path.join(root, 'app.json'), 'utf8'))
const referenced = [
  ['app.json > expo.icon', appJson.expo?.icon],
  ['app.json > expo.splash.image', appJson.expo?.splash?.image],
  ['app.json > expo.android.adaptiveIcon.foregroundImage', appJson.expo?.android?.adaptiveIcon?.foregroundImage],
]

const html = await readFile(path.join(root, 'index.html'), 'utf8')
for (const match of html.matchAll(/<link[^>]+href="(\/[^"]+\.(?:png|svg|ico))"/g)) {
  referenced.push([`index.html > ${match[1]}`, `public${match[1]}`])
}

const declared = new Set(expected.map(([relative]) => relative))
for (const [where, target] of referenced) {
  if (!target) {
    problems.push(`${where} — 아이콘 경로가 비어 있습니다.`)
    continue
  }
  const relative = target.replace(/^\.\//, '')
  if (!declared.has(relative)) {
    problems.push(`${where} — ${relative}를 가리키는데 이 검사 목록에 없습니다. 목록을 맞춰 주세요.`)
  }
}

if (problems.length > 0) {
  console.error(`아이콘 검사 실패 (${problems.length}건)`)
  for (const problem of problems) console.error(`  - ${problem}`)
  process.exit(1)
}

console.log(`아이콘 검사 통과 · ${sources.length + expected.length}개 파일 확인`)
