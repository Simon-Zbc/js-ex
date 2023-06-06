/*
 * ファイル名: appSync.js
 * 作成日: 2023/05/13
 * 作成者: simon-zbc
 * ver:1.0.0
 */
const AWSAppSyncClient = require('aws-appsync').default
const AWS = require('aws-sdk')
const SCAN_LIMIT_COUNT = 1000

AWS.config.update({
  region: process.env['REGION'],
})

module.exports = class AppSync {
  constructor() {
    const appsyncOpts = {
      auth: {
        type: 'AWS_IAM',
        credentials: () => AWS.config.credentials
      },
      disableOffline: true,
      region: process.env['REGION'],
      url: process.env['GRAPHQL_API_ENDPOINT'],
    }
    this.appSyncClient = new AWSAppSyncClient(appsyncOpts)
  }

  /**
   * scan取得
   * @param {object} queryParam クエリパラメータ
   * @param {int} pageLimit ページングの取得件数
   * @returns 実行結果
   */
  async scan(queryParam, pageLimit) {

    let allItems = []
    let scanResult = null
    let nextToken = null
    let limit = pageLimit ?? SCAN_LIMIT_COUNT
    do {
      //limit件数分ページング分割して取得
      scanResult = await this.appSyncClient.query({
        query: queryParam.query,
        variables: {
          ...queryParam.variables,
          limit,
          nextToken,
        },
      })

      //scanのデータ取得
      let dataResult = scanResult.data[Object.keys(scanResult.data)[0]]

      allItems.push(...dataResult.items)
      nextToken = dataResult.nextToken

    } while (nextToken !== null)

    //最後ののscan実行結果に、全scanデータを設定
    scanResult.data[Object.keys(scanResult.data)[0]].items = allItems

    return scanResult
  }

  /**
   * 一括登録（batchWrite）
   * @param {string} tableName テーブル名
   * @param {object} items 登録データ
   * @returns 実行結果
   */
  async batchWrite(tableName, items) {

    const documentClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' })

    // テーブル名の取得
    if (!process.env['GRAPHQL_API_ENDPOINT']) {
      throw new Error('Environment variable[GRAPHQL_API_ENDPOINT] does not exist')
    }
    const tableNameEnv = tableName + '-' + process.env['GRAPHQL_API_ENDPOINT'] + '-' + process.env['ENV']

    // 一括登録処理
    for (let i = 0; i < items.length;) {

      // 一括登録の登録最大件数は25件のため、25件単位で登録を行う
      let params = { RequestItems: {} }
      params.RequestItems[tableNameEnv] = []

      for (let j = 0; j < 25 && i < items.length; i++, j++) {
        //登録レコードの設定
        params.RequestItems[tableNameEnv].push({
          PutRequest: {
            Item: items[i]
          }
        })
      }
      await documentClient.batchWrite(params).promise()
    }
  }

  /**
   * 一括取得（batchGet）
   * @param {String} tableName テーブル名
   * @param {Array} keys キーリスト
   * @returns 実行結果
   */
  async batchGet(tableName, keys) {

    const documentClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' })

    // テーブル名の取得
    if (!process.env['GRAPHQL_API_ENDPOINT']) {
      throw new Error('Environment variable[GRAPHQL_API_ENDPOINT] does not exist')
    }
    const tableNameEnv = tableName + '-' + process.env['GRAPHQL_API_ENDPOINT'] + '-' + process.env['ENV']

    let unprocessedKeys = keys.slice()
    let items = []

    while (unprocessedKeys.length > 0) {
      let limit = 100
      let batchKeys = unprocessedKeys.splice(0, limit)
      let params = {
        TableName: tableNameEnv,
        RequestItems: {
          [tableNameEnv]: {
            Keys: batchKeys,
          },
        },
      }
      let res = await documentClient.batchGet(params).promise()
      items = items.concat(res.Responses[tableNameEnv])
      if (res.UnprocessedKeys[tableNameEnv] != undefined) {
        unprocessedKeys = unprocessedKeys.concat(res.UnprocessedKeys[tableNameEnv].Keys)
      }
    }
    return items
  }
}