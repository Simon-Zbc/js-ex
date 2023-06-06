/*
 * ファイル名: sample.js
 * 作成日：2023/05/13
 * 作成者: simon-zbc
 * ver:1.0.0
 */
const gql = require('graphql-tag')

const AppSync = require('./appSync')

module.exports = class Patients extends AppSync {
  constructor() {
    super()
  }

  async GetSample(id) {
    return await this.appSyncClient.query({
      query: gql(`
      query GetSample($id: ID!) {
        getSample(id: $id) {
          id
          groupId
          groupInfo {
            items {
              groupName
            }
            nextToken
          }
          userId
          userInfo {
            items {
              userName
            }
            nextToken
          }
          sampleInt
          sampleFloat
          sampleString
          sampleBool
          sampleDate
          sampleDateTime
          sampleJson
          ttl
          createdAt
          updatedAt
        }
      }
          `),
      variables: {
        id,
      },
    })
  }

  async CreateSample(input) {
    return await this.appSyncClient.mutate({
      mutation: gql(`
      mutation CreateSample(
        $input: CreateSampleInput!
        $condition: ModelSampleConditionInput
      ) {
        createSample(input: $input, condition: $condition) {
          id
          groupId
          userId
          sampleInt
          sampleFloat
          sampleString
          sampleBool
          sampleDate
          sampleDateTime
          sampleJson
          ttl
          createdAt
          updatedAt
        }
      }
          `),
      variables: {
        input: input
      },
    })
  }

  async UpdateSample(input) {
    return await this.appSyncClient.mutate({
      mutation: gql(`
      mutation UpdateSample(
        $input: UpdateSampleInput!
        $condition: ModelSampleConditionInput
      ) {
        updateSample(input: $input, condition: $condition) {
          id
          groupId
          userId
          sampleInt
          sampleFloat
          sampleString
          sampleBool
          sampleDate
          sampleDateTime
          sampleJson
          ttl
          createdAt
          updatedAt
        }
      }
      `),
      variables: {
        input: input
      },
    })
  }

  async DeleteSample(input) {
    return await this.appSyncClient.mutate({
      mutation: gql(`
      mutation DeleteSample(
        $input: DeleteSampleInput!
        $condition: ModelSampleConditionInput
      ) {
        deleteSample(input: $input, condition: $condition) {
          id
          groupId
          userId
          sampleInt
          sampleFloat
          sampleString
          sampleBool
          sampleDate
          sampleDateTime
          sampleJson
          ttl
          createdAt
          updatedAt
        }
      }
      `),
      variables: {
        input: input
      },
    })
  }

  async ListSamples(filter, pageLimit) {
    return await super.scan({
      query: gql(`
      query ListSamples(
        $filter: ModelSampleFilterInput
        $limit: Int
        $nextToken: String
      ) {
        listSamples(
          filter: $filter
          limit: $limit
          nextToken: $nextToken
        ) {
          items {
            id
            groupId
            groupInfo {
              items {
                groupName
              }
              nextToken
            }
            userId
            userInfo {
              items {
                userName
              }
              nextToken
            }
            sampleInt
            sampleFloat
            sampleString
            sampleBool
            sampleDate
            sampleDateTime
            sampleJson
            ttl
            createdAt
            updatedAt
          }
          nextToken
        }
      }
      `),
      variables: {
        filter
      },
    },
      pageLimit)
  }

  async BatchGet(keys) {
    return await super.batchGet("Sample", keys)
  }

  async BatchWrite(items) {
    await super.batchWrite("Sample", items)
  }
}