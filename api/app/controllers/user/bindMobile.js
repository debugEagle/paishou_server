'use strict'

const express = require('express')
const helper = require('../../helper')
const router = express.Router()


 /**
  * @api {post} /app/user/bindMobile/getsmscode 绑定手机-申请短信码
  * @apiGroup User
  *
  * @apiParam {String} mobile 手机号
  *
  * @apiUse Header
  *
  * @apiUse Success
  *
  * @apiDescription 10分钟内可以申请2次
  *
  * @apiVersion 1.0.0
  */
router.route('/getSmscode')
    .post(
        Services.token.decode,
        helper.user.checkBindMobile,
        helper.user.checkPhone,
        helper.user.isNotExist,
        helper.user.bindMobile.getSmscode
    )

/**
 * @api {post} /app/user/register/verifySmscode 绑定手机-验证短信码
 * @apiGroup User
 *
 * @apiParam {String} mobile 手机号
 * @apiParam {String} smsCode 短信码
 *
 * @apiUse Header
 *
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 200 OK
 *   Body:
 *   {
 *     'temToken': 'f37db6e2-fa96-4b48-9a18-91e82666083f'
 *   }
 *
 * @apiVersion 1.0.0
 */
router.route('/verifySmscode')
    .post(
        Services.token.decode,
        helper.user.checkBindMobile,
        helper.user.checkPhone,
        helper.user.register.verifySmscode
    )

/**
 * @api {post} /app/user/register/setPassword 绑定手机-设置密码
 * @apiGroup User
 *
 * @apiDescription 密码长度：6-16位
 *
 * @apiParam {String} mobile 手机号
 * @apiParam {String} password 密码
 * @apiParam {String} temToken 临时token
 *
 * @apiUse Header
 *
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 200 OK
 *   Body:
 *   {
 *     'token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9......'
 *   }
 *
 * @apiVersion 1.0.0
 */
router.route('/setPassword')
    .post(
        Services.token.decode,
        helper.user.checkBindMobile,
        helper.user.checkPhone,
        helper.user.isNotExist,
        helper.user.verifyPwd,
        helper.user.register.setPassword
    )


module.exports = router
