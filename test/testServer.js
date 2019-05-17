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

describe('GET Requests', function() {
    it('GET /', function(done) {
        chai.request(server)
            .get('/')
            .end(function(err, res) {
                res.should.have.status(200);
                done();
            })
    });
    it('GET /register', function(done) {
        chai.request(server)
            .get('/register')
            .end(function(err, res) {
                res.should.have.status(200);
                done();
            })
    });
    it('GET /confirm-account', function(done) {
        chai.request(server)
            .get('/confirm-account')
            .end(function(err, res) {
                res.should.have.status(200);
                done();
            })
    });
    // it('GET /e_transfer', function(done) {
    //
    //         chai.request(server)
    //         .get('/home/e_transfer/transfers')
    //         .end(function(err, res) {
    //             res.should.have.status(200);
    //             done();
    //         })
    //
    // })
    // it('GET /cur_calculator', function(done) {
    //
    //     chai.request(server)
    //         .get('/home/cur_calculator/calc')
    //         .end(function(err, res) {
    //             res.should.have.status(200);
    //             done();
    //         })
    //
    // })
});

describe('POST Requests', function () {

    after((done) => {
        done();
        process.exit();
    });

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
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.request._data.first_name.should.equal('Unit');
                res.request._data.last_name.should.equal('Test');
                res.request._data.email.should.equal('abc@gmail.com');
                done();
            });
    })
});