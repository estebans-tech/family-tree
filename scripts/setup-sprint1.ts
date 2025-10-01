import { Octokit } from '@octokit/rest'

const repo = process.env.GITHUB_REPO!
const token = process.env.GITHUB_TOKEN!
const [owner, repoName] = repo.split('/')

const octokit = new Octokit({ auth: token })

const labels = [
    { name: 'type:feature', color: '1f883d', description: 'New feature' },
    { name: 'type:bug', color: 'd73a4a', description: 'Defect' },
    { name: 'type:plugin', color: '0ea5e9', description: 'Penpot plugin work' },
    { name: 'type:api', color: '22c55e', description: 'Open API (external) work' },
    { name: 'area:parser', color: '795548', description: 'Prompt parsing & format' },
    { name: 'area:layout', color: '1e90ff', description: 'Layout & positioning' },
    { name: 'area:penpot', color: '6f42c1', description: 'Penpot integration' },
    { name: 'area:infra', color: '9ca3af', description: 'Infra / CI' },
    { name: 'good first issue', color: '7057ff', description: 'Good starter task' }
  ]

  const milestone = {
    title: 'Sprint 1',
    description: 'Penpot-first PoC: prompt → parse → layout → draw via Penpot Plugin',
    // two-week horizon by default
    due_on: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  }

  const issues = [
    {
      title: 'Define layout JSON contract',
      body: [
        '- Decide node and edge schema (ids, name, year, x, y, optional style)',
        '- Version the schema in README',
        '- Provide 2 sample payloads'
      ].join('\n'),
      labels: ['type:feature', 'area:layout', 'area:penpot']
    },
    {
      title: 'Penpot Plugin: skeleton & manifest',
      body: [
        '- Create minimal plugin manifest and UI',
        '- Local install & run inside a Penpot file',
        '- Button: "Generate from URL"'
      ].join('\n'),
      labels: ['type:feature', 'type:plugin', 'area:penpot', 'good first issue']
    },
    {
      title: 'Plugin: fetch layout JSON from Svelte endpoint',
      body: [
        '- Accept prompt in plugin UI or URL',
        '- Fetch from Svelte endpoint `/api/layout?q=...`',
        '- Validate response and show errors inline'
      ].join('\n'),
      labels: ['type:feature', 'type:plugin', 'area:penpot']
    },
    {
      title: 'Plugin: draw nodes and edges on canvas',
      body: [
        '- Create rectangles + text for people',
        '- Create connectors for parent → child',
        '- Group by generation (one group per row)'
      ].join('\n'),
      labels: ['type:feature', 'type:plugin', 'area:penpot']
    },
    {
      title: 'Plugin options: spacing, node size, theme',
      body: [
        '- Controls for xGap, yGap, nodeW, nodeH',
        '- Light/dark style switch',
        '- Persist last-used options per file if possible'
      ].join('\n'),
      labels: ['type:feature', 'type:plugin', 'area:penpot']
    },
    {
      title: 'Svelte endpoint: parse + layout + CORS',
      body: [
        '- Implement GET `/api/layout?q=...`',
        '- Reuse existing parser and layout utils',
        '- Enable CORS for Penpot origin'
      ].join('\n'),
      labels: ['type:feature', 'area:parser', 'area:layout', 'area:infra']
    },
    {
      title: 'Validation & error reporting end-to-end',
      body: [
        '- Parser returns structured errors',
        '- Endpoint maps errors to JSON',
        '- Plugin renders error list clearly'
      ].join('\n'),
      labels: ['type:feature', 'area:parser', 'area:penpot']
    },
    {
      title: 'README: setup + demo flow',
      body: [
        '- How to run Svelte app',
        '- How to install and run the Penpot plugin',
        '- Example prompt and expected result'
      ].join('\n'),
      labels: ['type:feature', 'area:infra', 'area:penpot', 'good first issue']
    },
    {
      title: 'CI: lint + typecheck on PR',
      body: [
        '- GitHub Actions job for `yarn lint` and `yarn svelte-check`',
        '- Protect main branch with required checks'
      ].join('\n'),
      labels: ['type:feature', 'area:infra']
    },
    // Optional spike for the alternative path
    {
      title: '[Spike] Penpot Open API feasibility',
      body: [
        '- Generate Access Token (fine-grained)',
        '- Create project/file via RPC and push a minimal changes list',
        '- Create a share link and document caveats'
      ].join('\n'),
      labels: ['type:api', 'area:penpot']
    }
  ]

async function ensureLabels() {
  for (const l of labels) {
    try {
      await octokit.issues.getLabel({ owner, repo: repoName, name: l.name })
    } catch {
      await octokit.issues.createLabel({ owner, repo: repoName, ...l })
    }
  }
}

async function ensureMilestone() {
    const { data } = await octokit.issues.listMilestones({ owner, repo: repoName, state: 'open' })
    const existing = data.find(m => m.title === milestone.title)
    if (existing) {
      // update description/due date in case it changed
      await octokit.issues.updateMilestone({
        owner,
        repo: repoName,
        milestone_number: existing.number,
        title: milestone.title,
        description: milestone.description,
        due_on: milestone.due_on
      })
      return existing.number
    }
    const created = await octokit.issues.createMilestone({ owner, repo: repoName, ...milestone })
    return created.data.number
  }
  async function listExistingIssueTitles() {
    const titles = new Set<string>()
    let page = 1
    while (true) {
      const { data } = await octokit.issues.listForRepo({
        owner,
        repo: repoName,
        state: 'all',
        per_page: 100,
        page
      })
      if (!data.length) break
      for (const i of data) titles.add(i.title)
      page += 1
    }
    return titles
  }
  
  async function createIssues(milestoneNumber: number) {
    const existingTitles = await listExistingIssueTitles()
    for (const i of issues) {
      if (existingTitles.has(i.title)) continue
      await octokit.issues.create({
        owner,
        repo: repoName,
        title: i.title,
        body: i.body,
        labels: i.labels,
        milestone: milestoneNumber
      })
    }
  }
  
  async function main() {
    await ensureLabels()
    const ms = await ensureMilestone()
    await createIssues(ms)
    console.log('Sprint 1 updated with Penpot-first labels, milestone, and issues')
  }
  
  main()