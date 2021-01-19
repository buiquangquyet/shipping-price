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
    },
    JT: {
      "domain": "http://sellapp.jtexpress.vn:22220",
      "price_url": "/yuenan-interface-web/standard/inquiry!newFreight.action",
      'client_code': 'JT'
    },
    VNP: {
      "domain": "https://donhang.vnpost.vn/api",
      "price_url": "/api/DoiTac/TinhCuocTatCaDichVu",
      'client_code': 'VNP'
    },
    BEST: {
      "domain": "http://price.vncpost.com/api/Service",
      "price_url": "/EstimateFee",
      'client_code': 'BEST'
    },
    V2: {
      GHN: {
        "domain": "https://online-gateway.ghn.vn",
        "price_url": "/shiip/public-api/v2/shipping-order/fee",
        'client_code': 'GHN',
        'token': 'ecd44ab8-9e73-11ea-b037-22fcf096d0e7',
      },
      EMS: {
        "domain": "http://ws.ems.com.vn",
        "price_url": "/api/v1/get-order-fee",
        "client_code": "EMS",
        "token": ""
      }
    },
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
    },
    JT: {
      "domain": "http://47.57.106.86",
      "price_url": "/yuenan-interface-web/standard/inquiry!newFreight.action",
      "api_key": "fe2acb33efb43c4401abb24f12478654",
      'client_code': 'JT'
    },
    VNP: {
      "domain": "https://vnpost.vnit.top/api",
      "price_url": "/api/DoiTac/TinhCuocTatCaDichVu",
      'client_code': 'VNP'
    },
    BEST: {
      "domain": "http://price.v3.vncpost.com/api/values",
      "price_url": "/EstimateFee",
      'client_code': 'BEST'
    },
    V2: {
      GHN: {
        "domain": "https://dev-online-gateway.ghn.vn",
        "price_url": "/shiip/public-api/v2/shipping-order/fee",
        'client_code': 'GHN',
        'token': '7fede88f-7d71-11ea-9891-0eb0c1f50d4f',
      },
      EMS: {
        "domain": "http://staging.ws.ems.com.vn",
        "price_url": "/api/v1/get-order-fee",
        "client_code": "EMS",
        "token": "e112d3812a0883459442eb1dd72e9db4"
      }
    },
  }
}
module.exports = SETTING