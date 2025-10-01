import type { Parsed, Person, Relation } from '$types/genealogy'

export type NodePos = Person & { x: number, y: number, gen: number }
export type EdgePos = { from: string, to: string }
export type Layout = { nodes: NodePos[], edges: EdgePos[] }

type Graph = {
  children: Map<string, string[]>
  parents: Map<string, string[]>
}

// Build parent/child maps from relations
function buildGraph(people: Person[], relations: Relation[]): Graph {
  const children = new Map<string, string[]>()
  const parents = new Map<string, string[]>()

  for (const p of people) {
    children.set(p.id, [])
    parents.set(p.id, [])
  }

  for (const r of relations) {
    if (r.type !== 'parent') continue
    children.get(r.from)!.push(r.to)
    parents.get(r.to)!.push(r.from)
  }

  return { children, parents }
}

// Assign generations: roots = 0, child.gen = max(parent.gen) + 1
function assignGenerations(people: Person[], g: Graph): Map<string, number> {
  const gen = new Map<string, number>()
  const indeg = new Map<string, number>()

  for (const p of people) indeg.set(p.id, g.parents.get(p.id)!.length)

  const queue: string[] = []
  for (const [id, d] of indeg) {
    if (d === 0) {
      gen.set(id, 0)
      queue.push(id)
    }
  }

  while (queue.length) {
    const u = queue.shift()!
    const base = gen.get(u) ?? 0
    for (const v of g.children.get(u)!) {
      const prev = gen.get(v)
      const candidate = base + 1
      if (prev == null || candidate > prev) gen.set(v, candidate)
      indeg.set(v, indeg.get(v)! - 1)
      if (indeg.get(v) === 0) queue.push(v)
    }
  }

  // Fallback for isolated nodes
  for (const p of people) if (!gen.has(p.id)) gen.set(p.id, 0)
  return gen
}

// Simple grid layout: group by generation, constant spacing
export function layoutParsed(
  parsed: Parsed,
  opts?: { xGap?: number, yGap?: number, nodeW?: number, nodeH?: number }
): Layout {
  const { people, relations } = parsed
  const xGap = opts?.xGap ?? 200
  const yGap = opts?.yGap ?? 140
  const nodeW = opts?.nodeW ?? 140
  const nodeH = opts?.nodeH ?? 60

  const g = buildGraph(people, relations)
  const genMap = assignGenerations(people, g)

  const byGen = new Map<number, Person[]>()
  for (const p of people) {
    const gidx = genMap.get(p.id) ?? 0
    if (!byGen.has(gidx)) byGen.set(gidx, [])
    byGen.get(gidx)!.push(p)
  }

  // Stable order within each generation
  for (const arr of byGen.values()) arr.sort((a, b) => a.name.localeCompare(b.name))

  const nodes: NodePos[] = []
  for (const [gidx, arr] of [...byGen.entries()].sort((a, b) => a[0] - b[0])) {
    const rowY = gidx * yGap
    arr.forEach((p, i) => {
      const x = i * xGap
      nodes.push({ ...p, x, y: rowY, gen: gidx })
    })
  }

  const edges: EdgePos[] = relations
    .filter(r => r.type === 'parent')
    .map(r => ({ from: r.from, to: r.to }))

  return { nodes, edges }
}
