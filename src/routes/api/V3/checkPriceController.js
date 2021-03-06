const baseService = require('./services/baseService')
const jtService = require('./services/jtService')
const commonService = require('./services/commonService')

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
            let services = req.body.data

            if(clientCode === baseService.CLIENT_CODE_AHAMOVE || clientCode === baseService.CLIENT_CODE_VNP) {
                return commonService.checkPrice(req, res, services)
            }

            return Promise.all(
                services.map(service => {
                    if(clientCode === baseService.CLIENT_CODE_JT) {
                        return jtService.getPriceFromDelivery(req, res, service)
                    }
                    if(clientCode === baseService.CLIENT_CODE_BEST) {
                        return commonService.getPriceFromDelivery(req, res, service)
                    }
                    if(clientCode === baseService.CLIENT_CODE_VTP) {
                        service = JSON.parse(JSON.stringify(service.data))
                    }
                    
                    //GRAB, GHN, EMS, VTPFW
                    return baseService.getPriceFromDelivery(req, res, service)
                })
                ).then(results => {
                    return res.json({s: 200, data: results})
                }).catch(error => {
                    return res.json({s: 500, data: error.message})
                })
            
        }
    }
}

module.exports = new checkPriceController()