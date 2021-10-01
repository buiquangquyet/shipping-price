const Setting = require('../../../../config/setting')
const axios = require('../../client')
const ClientService = require('../../util/clientService')
const qs = require('qs');

function AhaMoveController() {
    const self = {
        INFO_DELIVERY: Setting.IS_PRODUCTION ? Setting.PRODUCTION.V2.AHAMOVE : Setting.LOCAL.V2.AHAMOVE,
        FROM_CACHE: false,
        /**
         * Call API to delivery
         * @param req
         * @param res
         * @param dataServices
         * @returns
         */
        getPriceFromDelivery: (req, res, dataServices) => {
            return new Promise((resolve, reject) => {
                return axios.post(self.INFO_DELIVERY.domain + self.INFO_DELIVERY.price_url, dataServices, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(response => {
                    return resolve(response.data)
                }).catch(error => {
                    if (error.code && error.code === 'ECONNABORTED') {
                        let msgErr = 'Không thể kết nối đến máy chủ của hãng'
                        if (error.message !== undefined && error.message.length > 0) {
                            msgErr = error.message;
                        }
                        let data = {
                            code: false,
                            serviceId: 2,
                            msg: msgErr
                        }
                        return resolve(data)
                    } else {
                        error.response.data.serviceId = 2
                        return resolve(error.response.data)
                    }

                })
            })
        },

        /**
         * Generate keyCache
         * @param dataRequest
         * @param isTrial
         * @returns
         */
        genKeyCache: (dataRequest, isTrial) => {
            let from = dataRequest.SENDER_LOCATION_ID + '_' + dataRequest.SENDER_WARD_ID
            let to = dataRequest.RECEIVER_LOCATION_ID + '_' + dataRequest.RECEIVER_WARD_ID
            let coupon = dataRequest.COUPON;
            if (!dataRequest.COUPON) {
                coupon = 'NO_COUPON'
            }
            let service = 'all' //check giá all
            return ClientService.genKeyCache(isTrial, self.INFO_DELIVERY.client_code, service, from,
                to, dataRequest.PRODUCT_WEIGHT, dataRequest.PRODUCT_LENGTH, dataRequest.PRODUCT_WIDTH, dataRequest.PRODUCT_HEIGHT, coupon)
        }
    };

    return {
        /**
         * API server for php call
         * @param req
         * @param res
         * @returns
         */
        getPrice: async (req, res) => {
            let dataServices = JSON.parse(JSON.stringify(req.body.dataServices))
            let dataRequest = req.body.dataRequest
            let checkRequest = true
            let isTrial = dataRequest.IS_TRAIL
            let keyCache = self.genKeyCache(dataRequest, isTrial)
            let dataCache = await ClientService.getCache(keyCache).then(data => {
                if (data.s === 200 && isTrial) {
                    data.data.fromCache = true
                    return data.data
                }
                return null;
            })
            if (dataCache && isTrial) {
                return res.json({s: 200, data: dataCache})
            }
            return self.getPriceFromDelivery(req, res, dataServices)
                .then(results => {
                    let status = results.s ? results.s : 200
                    if (status === 200 && checkRequest && checkConnectRedis && isTrial) {
                        ClientService.setPriceToCache(keyCache, results, isTrial)
                    }
                    return res.json({s: status, data: results});
                })
        }

    }
}

module.exports = new AhaMoveController()