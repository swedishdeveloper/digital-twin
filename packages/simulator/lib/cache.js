import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const cacheDir = path.join(__dirname, '../.cache')

// Create cache directory if it doesn't exist
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir)
}

function createHash(object: any): string {
  const hash = crypto.createHash('sha1')
  hash.update(JSON.stringify(object))
  return hash.digest('hex')
}

async function getFromCache(object: any): Promise<any> {
  const hash = createHash(object)
  const filePath = path.join(cacheDir, hash)

  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          resolve(null)
        } else {
          reject(err)
        }
      } else {
        resolve(JSON.parse(data))
      }
    })
  })
}

async function updateCache(object: any, result: any): Promise<any> {
  const hash = createHash(object)
  const filePath = path.join(cacheDir, hash)

  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, JSON.stringify(result), 'utf8', (err) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

export {
  getFromCache,
  updateCache,
}
