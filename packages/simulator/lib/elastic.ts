import { Client, ClientOptions, RequestParams } from '@elastic/elasticsearch'
import mappings from '../data/elasticsearch_mappings.json'
import { error, info } from './log'

const host = process.env.ELASTICSEARCH_URL

if (!host) {
  info('No elasticsearch url provided, skipping statistics collection')
  const noOp = (name: string): (() => void) => () => {
    // info(`noOp: ${name}`)
  }
  module.exports = {
    save: noOp('save'),
    createIndices: noOp('createIndices'),
  }
} else {
  info(`Elasticsearch url provided, collecting statistics to ${host}`)
}

const client = new Client({ node: host })

const createIndices = (): Promise<void> =>
  Promise.all(
    Object.keys(mappings).map((index) => {
      return client.indices
        .create({
          index,
          body: mappings[index],
        })
        .catch((err) => {
          let errorType
          try {
            errorType = JSON.parse(err.response)?.error?.type
          } catch (e) {
            error(
              '>>>= Cannot create indices, Malformed Elasticsearch Error',
              e,
              err
            ).then(() => {})
          }
          if (errorType === 'resource_already_exists_exception') {
            error(`
            Index ${index} already mapped.
            If you want to re-map it:
            - Delete it in Elasticsearch
            - Re-run this script
            - Recreate "index pattern" in kibana.
          `)
          } else {
            error('>>>= Cannot create indices, Unkown Elasticsearch Error', err)
          }
        })
    })
  ).then(() => {})

const save = (booking: Record<string, any>, indexName: string): Promise<void> => 
  client
    .index({
      index: indexName,
      id: booking.id,
      body: booking,
    })
    .then(() => {})
    .catch((e) => {
      error('Could not save booking', e)
    })
}

const search = (searchQuery: RequestParams.Search): Promise<unknown> => 
  client.search(searchQuery).then(response => response.body)

module.exports = {
  createIndices,
  save,
  search,
}
