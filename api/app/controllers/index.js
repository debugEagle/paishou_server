
const express = require('express')
const router = express.Router()


router.use('/test', require('./test'))
router.use('/user', require('./user'))


module.exports = router