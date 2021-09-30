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
         * @param dataDelivery
         * @returns
         */
        getPriceFromDelivery: (req, res, dataDelivery) => {
            return new Promise((resolve, reject) => {
                return axios.post(self.INFO_DELIVERY.domain + self.INFO_DELIVERY.price_url , qs.stringify(dataDelivery), {
                }).then(response => {
                    response.data.serviceId = dataDelivery.service_id
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
         * @param dataDelivery
         * @returns
         */
        genKeyCache : (dataRequest, isTrial, dataDelivery) => {
            let from = dataRequest.SENDER_LOCATION_ID+'_'+dataRequest.SENDER_WARD_ID
            let to = dataRequest.RECEIVER_LOCATION_ID+'_'+dataRequest.RECEIVER_WARD_ID
            let coupon = dataRequest.COUPON;
            if (!dataRequest.COUPON) {
                coupon = 'NO_COUPON'
            }
            let serviceId = dataDelivery.service_id ? dataDelivery.service_id : dataDelivery.serviceId
            return ClientService.genKeyCache(isTrial, self.INFO_DELIVERY.client_code, serviceId, from,
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
            let dataServices = req.body.dataServices || [] //extra field when udpate check price with weight exchange
            let dataRequest = JSON.parse(JSON.stringify(req.body.data))
            let checkRequest = true

            let isTrial = req.body.isTrial
            console.log('isTrial', isTrial)
            return Promise.all(
                dataServices.map(dataService => {
                    let dataDelivery = JSON.parse(JSON.stringify(dataService.data))
                    dataDelivery.token = req.body.token
                    let keyCache = self.genKeyCache(dataRequest, isTrial, dataDelivery);
                    return ClientService.checkCachePrice(keyCache, true)
                        .then(result => {
                            if (result.s === 200) {
                                result.data.fromCache = true
                                return result.data
                            }
                            return null
                        }).then(resultCache => {
                            if (!isTrial) { // nếu k có cache thì sẽ gọi lên hãng
                                return self.getPriceFromDelivery(req, res, dataDelivery)
                            } else {
                                if (!resultCache) return self.getPriceFromDelivery(req, res, dataDelivery)
                            }
                            
                            return resultCache
                        })
                })
            ).then(results => {
                results.map(result => {
                    // nếu thành công thì ghi vào log - check thêm điều kiện có dvmr hay không và có hiện đang kết nối được vs redis hay không
                    if (result.polyline_points && checkRequest && checkConnectRedis && !result.fromCache) {
                         let keyCache = self.genKeyCache(dataRequest, isTrial, result)
                        ClientService.setPriceToCache(keyCache, result, isTrial)
                    }
                })

                return res.json({s: 200, data: results})
            }).catch(error => {
                return res.json({s: 500, data: error.message})
            })
        }

    }
}

module.exports = new AhaMoveController()