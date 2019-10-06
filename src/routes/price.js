const express = require('express');
const request = require('request-promise');
const config = require('config');
const router = express.Router();
const apicache = require('apicache');

let cache = apicache.middleware

// router.post('/price',cache('5 minutes'), async(req,res)=>{
router.post('/price', async(req,res)=>{
    // try {
        res.status(200).send(getPrice(req));
    // } catch (error) {
    //     res.status(500).send({message:'Interval server error'})
    // }
})

function getPrice(req) {
    var price_data = {
        "price": 0,
        "cod_price": 0,
        "total_price": 0
    };

    // if has cache
    //      return cache
    price_data = get_client_price(req);
console.dir(price_data);
process.exit();
    return price_data;
}

function get_client_price(req) {
    var return_value = null;
    var client = config.get(req.query.client_code);

    var price_url = client.domain + client.price_url;
    var price_req = {
        "token": client.token,
        "Weight": 1000,
        "FromDistrictID": 1443,
        "ToDistrictID": 1452,
        "ServiceID": 53319,
    }

    var options = {
        method: 'POST',
        uri: price_url,
        headers:{
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: price_req,
        json: true
    };
    let r1 = await request(options)
        .then(function(parsedBody) {
            console.log('test');
            console.dir(parsedBody)
        })
        .catch(function(err) {
            console.log('test err');
            console.dir(err)
        });
console.dir(r1);
process.exit();
        process.exit();
    // request.post(price_url, {
    //     json: price_req
    // }, (error, res, body) => {
    //     if (error) {
    //         console.error(error)
    //         return error;
    //     }
    //     console.log(`statusCode: ${res.statusCode}`);
    //     console.log(body);
    //     return body;
    // });

}

module.exports=router;