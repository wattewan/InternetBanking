'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../login_mongo');
const MongoClient = require('mongodb').MongoClient;
var expect = chai.expect;

const should = chai.should();
chai.use(chaiHttp);

const uri = "mongodb+srv://wattewan:8030113Bst@bankingapp-zcncj.mongodb.net/test?retryWrites=true";
const client = new MongoClient(uri, { useNewUrlParser: true });
client.connect(err => {
    if (err) {
        return console.log('Unable to connect to DB');
    }
    let db = client.db('test');
    console.log("Successfully connected to MongoDB server");
    // client.close();
});

describe('/saveUser', function () {

    it('add a single user on /saveUser POST', function (done) {
        return client.connect()
            .then(function () {
                let user = {
                    'username': 'Unit Test',
                    'password': 'abc123',
                    'first_name': 'Unit',
                    'last_name': 'Test',
                    'email': 'abc@gmail.com',
                    'phone_num': ''
                }
                chai.request(server)
                    .post('/saveUser', {
                        json: true})
                    .set('Accept', 'application/json')
                    .send(user)
                    .end(function (err, res) {
                        res.should.be.json;
                        res.should.have.status(200);
                        res.body.should.be.a('object');
                        res.body.SUCCESS.username.should.equal('Unit Test');
                        done();
                    });
            })

    })
})