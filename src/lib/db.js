// IndexedDB 贴纸图库管理
import { openDB } from 'idb'

const DB_NAME = 'CutCutDB'
const DB_VERSION = 1
const STORE = 'stickers'

let dbPromise = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('createdAt', 'createdAt')
        store.createIndex('category', 'category')
      },
    })
  }
  return dbPromise
}

export async function saveSticker({ id, originalBlob, stickerBlob, name, category }) {
  const db = await getDB()
  const record = {
    id,
    originalBlob,
    stickerBlob,
    name: name || `贴纸_${Date.now()}`,
    category: category || '未分类',
    createdAt: Date.now(),
  }
  await db.put(STORE, record)
  return record
}

export async function getAllStickers() {
  const db = await getDB()
  const all = await db.getAll(STORE)
  return all.sort((a, b) => b.createdAt - a.createdAt)
}

export async function deleteSticker(id) {
  const db = await getDB()
  await db.delete(STORE, id)
}

export async function deleteManyStickers(ids) {
  const db = await getDB()
  const tx = db.transaction(STORE, 'readwrite')
  await Promise.all(ids.map(id => tx.store.delete(id)))
  await tx.done
}

export async function getStickerCount() {
  const db = await getDB()
  return db.count(STORE)
}

export function blobToUrl(blob) {
  return URL.createObjectURL(blob)
}
