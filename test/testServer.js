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
        client.connect();
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
});

describe('/home/e_transfer/:name', function () {
    it('Send an E-Transfer to designated account based on email', function (done) {
        client.connect();
        chai.request(server)
            .post('/home/e_transfer/:name', {
                json: true
            })
            .set('Content-Type', 'application/json')
            .send({
                'transfer': 1000,
                'e_password': 'test_pass',
                'from': 'Test',
                'to': 'test@gmail.com',
            })
            .end(function (err, res) {
                //res.should.be.json;
                console.log(res.request._data);
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.request._data.transfer.should.equal(1000);
                res.request._data.e_password.should.equal('test_pass');
                res.request._data.to.should.equal('test@gmail.com');
                res.request._data.from.should.equal('Test');
                done();
            });
    })
});