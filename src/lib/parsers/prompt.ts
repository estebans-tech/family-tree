import type { Parsed, Person, Relation } from '$types/genealogy'

const idOf = (name: string, year?: number) =>
  `${name.toLowerCase().normalize('NFKD').replace(/[^\w]+/g, '-')}${year ? '-' + year : ''}`

const personToken = /\s*([A-Za-zÀ-ÖØ-öø-ÿ' -]+)\s*(?:\((\d{3,4})\))?\s*/

export function parsePrompt(input: string): Parsed {
  const peopleMap = new Map<string, Person>()
  const relations: Relation[] = []
  const errors: string[] = []

  const addPerson = (name: string, year?: number) => {
    const id = idOf(name, year)
    if (!peopleMap.has(id)) peopleMap.set(id, { id, name: name.trim(), year })
    return id
  }

  const lines = input.split(/\r?\n/).map(l => l.trim()).filter(Boolean)

  for (const line of lines) {
    const [left, right] = line.split('->').map(s => s?.trim())
    if (!left || !right) {
      errors.push(`Rad saknar "->": ${line}`)
      continue
    }

    const parents = left.split('+').map(s => s.trim()).filter(Boolean)
    if (parents.length === 0 || parents.length > 2) {
      errors.push(`Felaktig föräldradel: ${left}`)
      continue
    }

    const parsedParents = parents.map(p => {
      const m = p.match(personToken)
      if (!m) return null
      const name = m[1].trim()
      const year = m[2] ? Number(m[2]) : undefined
      return { id: addPerson(name, year), name, year }
    })

    if (parsedParents.some(x => x === null)) {
      errors.push(`Kunde inte tolka förälder: ${left}`)
      continue
    }

    const children = right.split(',').map(s => s.trim()).filter(Boolean)
    if (children.length === 0) {
      errors.push(`Inga barn angivna: ${line}`)
      continue
    }

    for (const c of children) {
      const m = c.match(personToken)
      if (!m) {
        errors.push(`Kunde inte tolka barn: ${c}`)
        continue
      }
      const name = m[1].trim()
      const year = m[2] ? Number(m[2]) : undefined
      const childId = addPerson(name, year)
      for (const p of parsedParents) relations.push({ type: 'parent', from: p!.id, to: childId })
    }
  }

  return { people: [...peopleMap.values()], relations, errors }
}
