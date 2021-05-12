const express = require('express')
const router = express.Router({})
const GHNController = require('./api/V2/ghnController')
const EMSController = require('./api/V2/emsController')
const VTPFWController = require('./api/V2/vtpfwController')
router.post('/ghn/get-price', GHNController.getPrice)
router.post('/ems/get-price', EMSController.getPrice)
router.post('/vtpfw/get-price', VTPFWController.getPrice)

module.exports = router
