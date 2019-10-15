const express = require('express')
const router = express.Router({})
const GHNController = require('./api/ghnController')

router.post('/ghn/get-price', GHNController.getPrice)

module.exports = router
