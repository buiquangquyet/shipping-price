const express = require('express')
const router = express.Router({})
const GHNController = require('./api/ghnController')
const VTPController = require('./api/vtpController')
const GHTKController = require('./api/ghtkController')
const SPLController = require('./api/splController')
const JTController = require('./api/jtController')

router.post('/ghn/get-price', GHNController.getPrice)
router.post('/vtp/get-price', VTPController.getPrice)
router.post('/ghtk/get-price', GHTKController.getPrice)
router.post('/spl/get-price', SPLController.getPrice)
router.post('/jt/get-price', JTController.getPrice)

module.exports = router
