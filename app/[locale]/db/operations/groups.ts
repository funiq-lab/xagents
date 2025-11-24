import { db, type Group } from '../schema'

export async function createGroup(name: string, color: string): Promise<number> {
  const id = await db.groups.add({
    name,
    color,
    createdAt: Date.now(),
  })
  if (id === undefined) {
    throw new Error('Failed to create group: ID is undefined')
  }

  return id
}

export async function updateGroup(
  id: number,
  updates: { name?: string, color?: string },
): Promise<void> {
  await db.groups.update(id, updates)
}

export async function deleteGroup(id: number): Promise<void> {
  const projects = await db.projects.where('groupId').equals(id).toArray()
  await Promise.all(
    projects.map(p => db.projects.update(p.id!, { groupId: undefined })),
  )

  await db.groups.delete(id)
}

export async function getGroupById(id: number): Promise<Group | undefined> {
  return await db.groups.get(id)
}

export async function getAllGroups(): Promise<Group[]> {
  return await db.groups.orderBy('createdAt').toArray()
}

export async function getGroupByName(name: string): Promise<Group | undefined> {
  return await db.groups.where('name').equals(name).first()
}
