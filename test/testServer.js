'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../login_mongo');
const MongoClient = require('mongodb').MongoClient;
var expect = chai.expect;

var should = chai.should();
chai.use(chaiHttp);

const uri = "mongodb+srv://wattewan:8030113Bst@bankingapp-zcncj.mongodb.net/test?retryWrites=true";
const client = new MongoClient(uri, { useNewUrlParser: true });

describe('/saveUser', function () {

    it('add a single user on /saveUser POST', function (done) {
        client.connect()
        chai.request(server)
            .post('/saveUser', {
                json: true
            })
            .set('Content-Type', 'application/json')
            .send({
                'username': 'Unit Test',
                'password': 'abc123',
                'first_name': 'Unit',
                'last_name': 'Test',
                'email': 'abc@gmail.com',
                'phone_num': ''
            })
            .end(function (err, res) {
                //res.should.be.json;
                console.log(res.request._data);
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.request._data.first_name.should.equal('Unit');
                res.request._data.last_name.should.equal('Test');
                res.request._data.email.should.equal('abc@gmail.com');
                done();
            });
    })
})