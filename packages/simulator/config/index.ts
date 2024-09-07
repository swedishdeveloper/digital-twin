import path from 'path'
import fs from 'fs'

const dataDir = path.join(__dirname, '..', 'config')
const paramsFileName = 'parameters.json'

// Saves a json parameter object to a parameter file in the data directory
const save = (value: object): void => {
  const file = path.join(dataDir, paramsFileName)
  fs.writeFileSync(file, JSON.stringify(value, null, 2))
}

// Returns the json parameters as an object from the parameter file in the data directory
const read = (): any => {
  const file = path.join(dataDir, paramsFileName)
  const result = JSON.parse(fs.readFileSync(file))
  console.log('result', result)
  return result
}

export const emitters = (): string[] => {
    const { emitters } = read()
    return emitters
  },
export const municipalities = (): string[] => {
    const { fleets } = read()
    return Object.keys(fleets)
  },
export { read, save }
