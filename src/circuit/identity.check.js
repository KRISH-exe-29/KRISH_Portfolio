// Run: node src/circuit/identity.check.js
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'

const source = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')
const banned = [
  'krishna', 'raju', 'krish-exe-29', 'krishna-ittl', 'krishnarajus2004',
  'portrait.jpg', 'buhler.jpg', 'indotech.jpg', 'iitb.jpg', 'ecell.jpg', 'speaking.jpg', 'nec-top7.jpg',
]
for (const value of banned) assert.equal(source.toLowerCase().includes(value), false, `index.html contains ${value}`)
const root = new URL('../../', import.meta.url)
const dist = new URL('dist/index.html', root)
if (existsSync(dist)) {
  const built = readFileSync(dist, 'utf8').toLowerCase()
  for (const value of banned) assert.equal(built.includes(value), false, `dist/index.html contains ${value}`)
}
// Identity must only ever come from content.js, never from a literal in the UI code.
const components = new URL('src/components/', root)
const appSources = [new URL('src/App.jsx', root)]
if (existsSync(components)) appSources.push(...readdirSync(components).map((name) => new URL(name, components)))
for (const file of appSources) {
  const text = readFileSync(file, 'utf8').toLowerCase()
  for (const value of banned) assert.equal(text.includes(value), false, `${file} contains ${value}`)
}
console.log('identity head ok')
