/**
 * 仅同步 uni CLI 要求的 src/manifest.json、src/pages.json（Netlify Linux）
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const src = path.join(root, 'src')

if (fs.existsSync(src)) fs.rmSync(src, { recursive: true, force: true })
fs.mkdirSync(src, { recursive: true })

for (const f of ['manifest.json', 'pages.json', 'App.vue', 'main.js', 'uni.scss']) {
	const from = path.join(root, f)
	if (fs.existsSync(from)) fs.copyFileSync(from, path.join(src, f))
}

for (const d of ['uni_modules', 'utils', 'pages', 'static']) {
	const from = path.join(root, d)
	if (fs.existsSync(from)) fs.cpSync(from, path.join(src, d), { recursive: true })
}

console.log('[sync-src] CLI src/ ready')
