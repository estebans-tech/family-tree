export type Person = {
  id: string;
  name: string;
  year?: number
}

export type Relation = {
  type: "parent"
  from: string
  to: string
}

export type Parsed = {
  people: Person[]
  relations: Relation[]
  errors: string[]
 }