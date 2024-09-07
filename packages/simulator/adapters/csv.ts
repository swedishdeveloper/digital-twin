import fs from 'fs'
import parse from 'csv-parse/lib/sync';

const readCsv = (path: string): CsvData[] => {
  const input = fs.readFileSync(path, 'utf-8');
  return parse(input, {
    columns: true,
    skip_empty_lines: true,
  }) as CsvData[];
}

export { readCsv }
