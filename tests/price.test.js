const server = require('../src/index');
const request = require('supertest');
const { expect } = require('chai');


describe('Price API Tests',()=>{
    it('GET /api/v1/price/ returns an array of price data',async()=>{
        const response= await request(server).get('/api/v1/price/');
        expect(response.status).to.equal(200)
        expect(response.body).to.be.an.instanceof(Object);
        expect(response.body).to.include.keys(['price','cod_price','total_price']);
    })
})