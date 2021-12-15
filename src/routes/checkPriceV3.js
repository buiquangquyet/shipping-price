const express = require('express')
const router = express.Router({})
const checkPriceController = require('./api/V3/checkPriceController')

router.post('/check-price', checkPriceController.checkPrice)

module.exports = router
