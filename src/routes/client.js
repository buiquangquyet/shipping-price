const axios = require('axios')
const moment = require('moment')
const requestLogger = require('./requestLogger')
const responseLogger = require('./responseLogger')

const axiosInstance = axios.create({
  timeout: 30000, // ms
  withCredentials: true
})

// Add a request interceptor -> save log request
axiosInstance.interceptors.request.use(request => {
  try {
    requestLogger.info('[' + moment().format('YYYY-MM-DD HH:mm:ss') + '] Log Request', request);
  } catch (e) {
    console.log(e)
  }
  return request
}, error => {
  try {
    requestLogger.info('[' + moment().format('YYYY-MM-DD HH:mm:ss') + '] Log Request', error);
  } catch (e) {
    console.log(e)
  }
  return Promise.reject(error);
})

// Add a response interceptor -> save log response
axiosInstance.interceptors.response.use(response => {
  // Any status code that lie within the range of 2xx cause this function to trigger
  try {
    let res = {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      config: response.config,
      data: response.data,
    }
    responseLogger.info('[' + moment().format('YYYY-MM-DD HH:mm:ss') + '] Log Response', res);
  } catch (e) {
    console.log(e)
  }
  return response;
}, error => {
  // Any status codes that falls outside the range of 2xx cause this function to trigger
  try {
    let response = error.response;
    let res = {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      config: response.config,
      data: response.data,
    }
    responseLogger.info('[' + moment().format('YYYY-MM-DD HH:mm:ss') + '] Log Response', res);
  } catch (e) {
    console.log(e)
  }
  return Promise.reject(error);
});

module.exports = axiosInstance;