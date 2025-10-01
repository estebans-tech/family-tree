import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const repo = process.env.GITHUB_REPO
const token = process.env.GITHUB_TOKEN

if (!repo || !token) {
  // let the commit proceed, just warn
  process.stderr.write('resolve-issues: missing GITHUB_REPO or GITHUB_TOKEN\n')
  process.exit(0)
}

const [owner, repoName] = repo.split('/')

async function listOpenIssues() {
  const titles = new Map()
  let page = 1
  while (true) {
    const url = `https://api.github.com/repos/${owner}/${repoName}/issues?state=open&per_page=100&page=${page}`
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
    if (!res.ok) break
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) break
    for (const i of data) {
      // skip PRs
      if (i.pull_request) continue
      titles.set(i.title, i.number)
    }
    page++
  }
  return titles
}

async function main() {
  const msgFile = process.argv[2]
  if (!msgFile) process.exit(0)

  const abs = path.resolve(msgFile)
  const original = fs.readFileSync(abs, 'utf8')

  const re = /\[(close|fix|resolve):"([^"]+)"\]/gi
  const matches = [...original.matchAll(re)]
  if (matches.length === 0) process.exit(0)

  const titleToNum = await listOpenIssues()
  const lines = []

  for (const m of matches) {
    const title = m[2]
    const num = titleToNum.get(title)
    if (num) lines.push(`Closes #${num}`)
    else process.stderr.write(`resolve-issues: no open issue with title "${title}"\n`)
  }

  if (lines.length === 0) process.exit(0)

  const appended = original.trimEnd() + '\n\n' + lines.join('\n') + '\n'
  fs.writeFileSync(abs, appended, 'utf8')
}

main()