const express = require('express')
const router = express.Router({})
const GHNController = require('./api/V2/ghnController')
const EMSController = require('./api/V2/emsController')
router.post('/ghn/get-price', GHNController.getPrice)
router.post('/ems/get-price', EMSController.getPrice)

module.exports = router
