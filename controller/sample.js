/*
 * ファイル名: sample.js
 * 作成日: 2023/05/13
 * 作成者: simon-zbc
 * 作成内容: 新規作成
 * ver:1.0.0
 */
const moment = require('moment')
const express = require('express')
const router = express.Router()
const { query, body, validationResult } = require('express-validator')
const ExtensibleCustomError = require('extensible-custom-error')
class BadRequestError extends ExtensibleCustomError { } // 400
class NotFoundError extends ExtensibleCustomError { } // 404
const UserModel = require(process.env.AWS_REGION ? '/opt/model/sample' : '../../../../layerone/opt/model/sample')

/**
 * @swagger
 * /user/profiles:
 *   get:
 *     tags:
 *     - ユーザー_プロファイル
 *     summary: プロファイル取得
 *     description: ユーザー情報を取得する
 *     parameters:
 *     - name: X-Auth-Token
 *       in: header
 *       description: 認証トークン
 *       required: true
 *       schema:
 *         type: string
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/userProfileGet'
 *       400:
 *         $ref: '#/components/responses/400'
 *       404:
 *         $ref: '#/components/responses/404'
 *       500:
 *         $ref: '#/components/responses/500'
 *
 * components:
 *   schemas:
 *     userProfile:
 *       description: ユーザープロファイル
 *       required:
 *         - nickName
 *         - birthYm
 *         - gender
 *       type: object
 *       properties:
 *         nickName:
 *           type: string
 *           maxLength: 64
 *           description: 画面表示名
 *         birthYm:
 *           type: string
 *           description: |
 *             生年月  
 *             - ISOフォーマット(YYYY-MM)とする
 *         gender:
 *           type: string
 *           enum:
 *           - male
 *           - female
 *           description: |
 *             - male: 男性  
 *             - female: 女性
 *         tel:
 *           type: string
 *           maxLength: 11
 *           description: |
 *             電話番号
 *         mail:
 *           type: string
 *           description: メールアドレス
 *     photoGet:
 *       description: プロファイル写真取得
 *       type: object
 *       properties:
 *         profilePhotoPath:
 *           type: string
 *           description: |
 *             写真URL
 *         profilePhotoKey:
 *           type: string
 *           description: |
 *             写真キー
 *     userProfileGet:
 *       allOf:
 *       - type: object
 *         properties:
 *           userId:
 *             type: string
 *             description: ユーザーID
 *       - $ref: '#/components/schemas/userProfile'
 *       - $ref: '#/components/schemas/photoGet'
 */

router.get('/', [
], (req, res, next) => {
  (async () => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return next(new BadRequestError(errors.array()[0].msg))
    }
    
    const userModel = new UserModel()
    const getUserResult = await userModel.GetUser(req.userId)
    const userInfo = getUserResult.data.getUser
    if (!userInfo) {
      return next(new NotFoundError('User data not found'))
    }
    
    const result = {
      userId: req.userId,
      nickName: userInfo.nickName,
      birthYm: userInfo.birthYm,
      gender: userInfo.gender,
      tel: userInfo.tel,
      mail: userInfo.mail,
      profilePhotoPath: userInfo.profilePhotoPath,
      profilePhotoKey: userInfo.profilePhotoKey
    }
    
    return res.json(result)
  })().catch(e => next(e))
})

module.exports = router