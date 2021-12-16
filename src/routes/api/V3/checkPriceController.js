const Setting = require('../../../../config/setting')
const axios = require('../../client')
const baseService = require('./services/baseService')
const vnpService = require('./services/vnpService')
const jtService = require('./services/jtService')
const bestService = require('./services/bestService')
const ahamoveService = require('./services/ahamoveService')

function checkPriceController() {
    return {
        /**
         * API server for php call
         * @param req
         * @param res
         * @returns
         */
         checkPrice: (req, res) => {
            let clientCode = req.body.client_code

            if(clientCode === baseService.CLIENT_CODE_JT) {
                return jtService.checkPrice(req, res)
            }

            if(clientCode === baseService.CLIENT_CODE_BEST) {
                return bestService.checkPrice(req, res)
            }

            if(clientCode === baseService.CLIENT_CODE_AHAMOVE) {
                return ahamoveService.checkPrice(req, res)
            }

            let services = req.body.data

            if(clientCode === baseService.CLIENT_CODE_VNP) {
                return vnpService.checkPrice(req, res, services)
            }

            return baseService.checkPrice(req, res, services)
            
        }
    }
}

module.exports = new checkPriceController()