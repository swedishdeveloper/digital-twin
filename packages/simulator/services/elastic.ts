import { Client, RequestParams } from '@elastic/elasticsearch'
import { info, error } from './log'

const host: string = process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
const client = new Client({ node: host })

const noOp = (name: string) => () => {
  error(`Elasticsearch not configured, ${name} not executed`)
}

const save = (booking: Record<string, any>, indexName: string): Promise<void> => 
  client.index({
    index: indexName,
    body: booking,
  }).then(() => {})

const createIndices = (indices: string[]): Promise<void[]> => 
  Promise.all(
    indices.map((index) =>
      client.indices.create({ index }, { ignore: [400] })
    )
  ).then(() => {})

const search = (searchQuery: RequestParams.Search): Promise<unknown> => 
  client.search(searchQuery).then(response => response.body)

export {
  save: process.env.ELASTICSEARCH_URL ? save : noOp('save'),
  createIndices: process.env.ELASTICSEARCH_URL ? createIndices : noOp('createIndices'),
  search: process.env.ELASTICSEARCH_URL ? search : noOp('search'),
}
