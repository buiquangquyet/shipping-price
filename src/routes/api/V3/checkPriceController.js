const Setting = require('../../../../config/setting')
const axios = require('../../client')
const baseService = require('./services/baseService')
const vnpService = require('./services/vnpService')
const jtService = require('./services/jtService')

function checkPriceController() {
    return {
        /**
         * API server for php call
         * @param req
         * @param res
         * @returns
         */
         checkPrice: (req, res) => {
            let services = req.body.data
            let clientCode = req.body.client_code
            if(clientCode === baseService.CLIENT_CODE_VNP) {
                return vnpService.checkPrice(req, res, services)
            }

            if(clientCode === baseService.CLIENT_CODE_JT) {
                return jtService.checkPrice(req, res)
            }

            return baseService.checkPrice(req, res, services)
            
        }
    }
}

module.exports = new checkPriceController()