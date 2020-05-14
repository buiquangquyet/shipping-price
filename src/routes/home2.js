const express = require('express')
const router = express.Router({})
const GHNController = require('./api/V2/ghnController')
router.post('/ghn/get-price', GHNController.getPrice)

module.exports = router
