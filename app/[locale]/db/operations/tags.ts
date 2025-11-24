import { db, type Tag } from '../schema'

export async function createTag(name: string, color: string): Promise<number> {
  const id = await db.tags.add({
    name,
    color,
    createdAt: Date.now(),
  })
  if (id === undefined) {
    throw new Error('Failed to create tag: ID is undefined')
  }

  return id
}

export async function updateTag(
  id: number,
  updates: { name?: string, color?: string },
): Promise<void> {
  await db.tags.update(id, updates)
}

export async function deleteTag(id: number): Promise<void> {
  const projects = await db.projects.toArray()
  await Promise.all(
    projects
      .filter(p => p.tagIds.includes(id))
      .map(p =>
        db.projects.update(p.id!, {
          tagIds: p.tagIds.filter(tid => tid !== id),
          updatedAt: Date.now(),
        }),
      ),
  )

  await db.tags.delete(id)
}

export async function getTagById(id: number): Promise<Tag | undefined> {
  return await db.tags.get(id)
}

export async function getAllTags(): Promise<Tag[]> {
  return await db.tags.orderBy('createdAt').toArray()
}

export async function getTagByName(name: string): Promise<Tag | undefined> {
  return await db.tags.where('name').equals(name).first()
}
