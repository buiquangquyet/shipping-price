
function ClientService() {
  this.genKeyCache = function (isTrial, clientCode, serviceId, from, to, weight, length = 0, width = 0,
                               height = 0, moneyCollection = 0, couponCode = 'NO_COUPON', productPrice = 0) {
    let string = clientCode + '_' + serviceId + '_' + from + '_' + to + '_'
      + weight + '_' + length + '_' + width + '_' + height + '_' + moneyCollection + '_' + couponCode + '_' + productPrice

    if (isTrial) {
      return 'TRIAL_' + string
    }

    return string
  },
  this.checkCachePrice = function (keyCache, checkReqeust) {

      return new Promise((resolve, reject) => {
        if (!checkConnectRedis || !checkReqeust) {
          return resolve({
            s: 500, data: null
          })
        }
        return clientRedis.get(keyCache, (err, data) => {
          if (data) {
            try {
            return resolve({
              s: 200, data: JSON.parse(data)
            })

          } catch (e) {
              return resolve({
                s: 500, data: null
              })
            }
          }
          return resolve({
            s: 500, data: null
          })
        })
      })

  },
  this.setPriceToCache = function (keyCache, data, isTrial) {
    if (isTrial) {
      clientRedis.set(keyCache, JSON.stringify(data))
    } else {
      clientRedis.setex(keyCache, 300, JSON.stringify(data))
    }
  }
}

module.exports = new ClientService()