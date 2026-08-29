import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const from = join(root, 'build', 'expo-html', 'index.html')
const to = join(root, 'gameHtml.ts')
const html = readFileSync(from, 'utf8')
writeFileSync(to, `export const GAME_HTML = ${JSON.stringify(html)}\n`)
console.log('Expo 게임 HTML을 준비했어요:', to)
