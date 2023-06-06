const fs = require('fs')
const html = require('html')
const marked = require('marked')
var express = require('express')
var cors = require('cors')
var awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')

global.fetch = require('node-fetch')
const ExtensibleCustomError = require('extensible-custom-error')
class BadRequestError extends ExtensibleCustomError { } // 400
class UnauthorizedError extends ExtensibleCustomError { } // 401
class ForbiddenError extends ExtensibleCustomError { } // 403

const crypto = require('crypto')
const swaggerUi = require('swagger-ui-express')
const swaggerJSDoc = require('swagger-jsdoc')
const yaml = require('js-yaml')

const Cognito = require('../../../../layerone/opt/service/cognito')
const SampleController = require('./controller/sample')

// declare a new express app
var app = express()
app.use(express.json({ extended: true, limit: '100mb' }))
app.use(awsServerlessExpressMiddleware.eventContext())
app.use(cors())

// Enable CORS for all methods
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', '*')
  //req.header('Access-Control-Allow-Headers', 'Content-Type, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token, X-Auth-Token')
  next()
})

/**
 * トークン認証
 */
const auth = async (req, res, next) => {
  (async () => {
    var url = req.url

    if (!req.header('X-Auth-Token')) throw new UnauthorizedError('Token not Found')
    const token = req.header('X-Auth-Token')
    
    /**
     * Cognitoトークン認証
     */
    const cognito = new Cognito()
    const verifyResult = await cognito.verifyToken(token)
    req.userId = verifyResult['cognito:username']

    next()
  })().catch(e => {
    switch (e.name) {
      // 不正なトークン
      case 'TokenNotFound':
      case 'InvalidTokenUse':
      case 'UserNotFoundException':
        next(new BadRequestError(e.message))
        break
      // 期限切れ
      case 'TokenExpiredError':
        next(new UnauthorizedError(e.message))
        break
      default:
        next(e)
    }
  })
}

const options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Open API',
      version: '0.0.1'
    },
    //basePath: '/v1'
  },
  apis: [
    process.env.AWS_REGION ? './app.js' : 'amplify/backend/function/sample/src/app.js',
    process.env.AWS_REGION ? './controller/*.js' : 'amplify/backend/function/sample/src/controller/*.js',
  ]
}

/* Swagger共通部分記述 */
/**
 * @swagger
 * components:
 *   schemas:
 *     errorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: エラーメッセージ
 *           example: Bad Request
 *         detail:
 *           type: string
 *           description: エラー内容詳細
 *           example: account is required
 *   responses:
 *     400:
 *       description: Bad Request
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/errorResponse'
 *     401:
 *       description: Unauthorized
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/errorResponse'
 *     403:
 *       description: Forbidden
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/errorResponse'
 *     500:
 *       description: Internal Server Error
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/errorResponse'
 */
 
app.use('/v1/spec', swaggerUi.serve, swaggerUi.setup(swaggerJSDoc(options)))
app.get('/v1/spec-docs.yaml', function (req, res) {
  const swaggerSpecYaml = yaml.dump(swaggerJSDoc(options))
  res.setHeader('Content-Type', 'text/plain')
  res.send(swaggerSpecYaml)
})
app.get('/v1/change-log', function (req, res) {
  const contents = fs.readFileSync(process.cwd() + '/CHANGELOG.md', { encoding: 'utf-8' })
  let output = '<html lang="ja"><head><meta charset="UTF-8"><title>Update Log</title></head><body>'
  output += html.prettyPrint(marked.marked(contents))
  output += '</body></html>'
  res.setHeader('Content-Type', 'text/html')
  output
  res.send(output)
})

app.use('/v1/user/profiles', SampleController)

// 404エラー
app.use((req, res) => {
  res.status(404)
  res.json({ message: 'URL Not Found', detail: `URL: ${req.originalUrl} is Not Found` })
})

// その他エラー
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'dev' ? err : {}
  switch (err.name) {
    case 'UnauthorizedError':
      res.status(401).json({ message: 'Unauthorized', detail: err.message })
      break
    case 'BadRequestError':
      res.status(400).json({ message: 'Bad Request', detail: err.message })
      break
    case 'ForbiddenError':
      res.status(403).json({ message: 'Forbidden', detail: err.message })
      break
    case 'NotFoundError':
      res.status(404).json({ message: 'Not Found', detail: err.message })
      break
    default:
      res.status(err.status || 500).json({ message: 'Internal Server Error', detail: err.message })
  }
})

module.exports = app