import fs from 'fs';
import parse from 'csv-parse';

const readCsv = (path: string): any => {
  const input = fs.readFileSync(path)
  return parse(input, {
    columns: true,
    skip_empty_lines: true,
  })
}

export { readCsv };
