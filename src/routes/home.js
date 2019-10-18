const express = require('express')
const router = express.Router({})
const GHNController = require('./api/ghnController')
const VTPController = require('./api/vtpController')

router.post('/ghn/get-price', GHNController.getPrice)
router.post('/vtp/get-price', VTPController.getPrice)

module.exports = router
