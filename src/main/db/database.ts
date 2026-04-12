import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import iso286Data from '../../../data/standards/tolerances/iso286.json'
import as568Data from '../../../data/standards/o-ring/as568.json'

let db: Database.Database

export function initDatabase() {
  const userDataPath = app.getPath('userData')
  const dbPath = join(userDataPath, 'mechbox.db')

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  // 创建公差 IT 等级表
  db.prepare(`
    CREATE TABLE IF NOT EXISTS tolerance_it_grades (
      grade TEXT,
      size_index INTEGER,
      value INTEGER,
      PRIMARY KEY (grade, size_index)
    )
  `).run()

  // 创建基本偏差表
  db.prepare(`
    CREATE TABLE IF NOT EXISTS fundamental_deviations (
      type TEXT, -- 'holes' or 'shafts'
      position TEXT,
      size_index INTEGER,
      value INTEGER,
      PRIMARY KEY (type, position, size_index)
    )
  `).run()

  // 创建 O型圈标准表
  db.prepare(`
    CREATE TABLE IF NOT EXISTS oring_standards (
      standard TEXT,
      code TEXT,
      id REAL,
      cs REAL,
      PRIMARY KEY (standard, code)
    )
  `).run()

  // 导入初始数据 (仅当表为空时)
  const itCount = db.prepare('SELECT count(*) as count FROM tolerance_it_grades').get() as { count: number }
  if (itCount.count === 0) {
    const insertIT = db.prepare('INSERT INTO tolerance_it_grades (grade, size_index, value) VALUES (?, ?, ?)')
    const transaction = db.transaction((data) => {
      for (const [grade, values] of Object.entries(data)) {
        (values as number[]).forEach((val, idx) => insertIT.run(grade, idx, val))
      }
    })
    transaction(iso286Data.it_grades)
  }

  const devCount = db.prepare('SELECT count(*) as count FROM fundamental_deviations').get() as { count: number }
  if (devCount.count === 0) {
    const insertDev = db.prepare('INSERT INTO fundamental_deviations (type, position, size_index, value) VALUES (?, ?, ?, ?)')
    const transaction = db.transaction((data) => {
      for (const [type, positions] of Object.entries(data)) {
        for (const [pos, values] of Object.entries(positions as any)) {
          (values as number[]).forEach((val, idx) => insertDev.run(type, pos, idx, val))
        }
      }
    })
    transaction(iso286Data.fundamental_deviations)
  }

  const oringCount = db.prepare('SELECT count(*) as count FROM oring_standards').get() as { count: number }
  if (oringCount.count === 0) {
    const insertOring = db.prepare('INSERT INTO oring_standards (standard, code, id, cs) VALUES (?, ?, ?, ?)')
    const transaction = db.transaction((data) => {
      data.sizes.forEach((s: any) => insertOring.run(data.standard, s.code, s.id, s.cs))
    })
    transaction(as568Data)
  }

  console.log('Database initialized at:', dbPath)
  return db
}

export function getDatabase() {
  return db
}
