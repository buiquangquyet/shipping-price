let SETTING = {
  IS_PRODUCTION: true,
  PRODUCTION: {
    NAME: "Server Production",
    PORT: 3000,
    URL: "",
    REDIS: {
      'port': 6379,
      'host': 'localhost',
      'pass': ''
    },
    // REDIS_URL: "redis://localhost:6379",
    GHN: {
      "domain": "https://console.ghn.vn",
      "price_url": "/api/v1/apiv3/CalculateFee",
      'client_code': 'GHN'
    },
    VTP: {
      "domain": "https://partner.viettelpost.vn",
      "price_url": "/v2/order/getPrice",
      'client_code': 'VTP'
    },
    GHTK: {
      "domain": "https://services.giaohangtietkiem.vn",
      "price_url": "/services/shipment/fee",
      'client_code': 'GHTK'
    },
    SPL: {
      "domain": "http://partner.speedlink.vn/Partner",
      "price_url": "/checkTransportationFee",
      "api_key": "8623977C8970FECBEF28CD0D8165E01A90605107",
      'client_code': 'SPL'
    }
  },
  LOCAL: {
    NAME: "Server Developement",
    PORT: 3000,
    URL: "",
    REDIS: {
      'port': 6379,
      'host': 'localhost',
      'pass': ''
    },
    GHN: {
      "domain": "https://dev-online-gateway.ghn.vn",
      "price_url": "/apiv3-api/api/v1/apiv3/CalculateFee",
      'client_code': 'GHN'
    },
    VTP: {
      "domain": "https://partner.viettelpost.vn",
      "price_url": "/v2/order/getPrice",
      'client_code': 'VTP'
    },
    GHTK: {
      "domain": "https://dev.ghtk.vn",
      "price_url": "/services/shipment/fee",
      'client_code': 'GHTK'
    },
    SPL: {
      "domain": "http://staging.partner.speedlink.vn/Partner",
      "price_url": "/checkTransportationFee",
      "api_key": "F55EDDE2C35BA331A0C91D4960AE6C057BA84EF5",
      'client_code': 'SPL'
    }
  }
}
module.exports = SETTING