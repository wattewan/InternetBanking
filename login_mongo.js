const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const bodyParser = require('body-parser');
const port = process.env.PORT || 8080;
const hbs = require('hbs');
const request = require('request');

var session = require('express-session');
var exphbs = require('express-handlebars');
var path = require('path');
var utils = require('./mongo_init.js');


var app = express();

app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + '/views/partials');


app.listen(port, () => {
    console.log(`Server is up on port ${port}`);
    utils.init();
});

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.get('/', function(request, response) {

    // var db = utils.getDb();
    response.sendFile(path.join(__dirname + '/login.html'));
});

app.post('/auth', function(request, response) {
    // var id = request.body.id;
    // var name = request.body.name;
    // var email = request.body.email;

    var db = utils.getDb();
    var username = request.body.username;
    var password = request.body.password;
    if (username && password) {
        db.collection('bank').find({username: username, password: password}).toArray((err, userinfo) => {

                if (userinfo.length > 0) {
                    //console.log(userinfo);
                    
                    // response.redirect(`/home/${username}`);
                    response.redirect(`/phone/${username}`);

                } else {
                    response.send('Incorrect Username and/or Password!');
                }
                response.end();
            }
        )
    } else {
        response.send('Please enter Username and Password!');
        response.end();
    }
});


app.post('/saveUser', function(request, response) {

    var username = request.body.username;
    var password = request.body.password;
    var first_name = request.body.first_name;
    var last_name = request.body.last_name;
    var checkings = request.body.checkings;
    var savings = request.body.savings;
    var email = request.body.email;
    var phone_num = request.body.phone_num;
    var total_balance = request.body.checkings + request.body.checkings;

    var db = utils.getDb();
    db.collection('bank').insertOne({
            username: username,
            password: password,
            first_name: first_name,
            last_name: last_name,
            checkings: checkings,
            savings: savings,
            email: email,
            phone_num: phone_num
        },(err, result) => {
            if(err){
                console.log('Unable to insert user');
            }
            response.send(JSON.stringify(result.ops, undefined, 2));
        }
    )
});

//Backup

// app.get('/home/update/:name', function(request, response) {
//
//     // var username = request.body.username;
//     var db = utils.getDb();
//
//     response.render("update.hbs");
//     var pass_word = request.body.password;
//     var first_name = request.body.first_name;
//     var last_name = request.body.last_name;
//     var email = request.body.email;
//     var phone_num = request.body.phone_num;
//
//     var user_name = request.params.name;
//     db.collection('bank').find({username: user_name}).toArray((err, docs) => {
//         if(err){
//             console.log('Unable to get user');
//         }
//         db.collection('bank').update({username: user_name}, {$set: {username: user_name, password: pass_word, first_name: first_name, last_name: last_name, email: email, phone_num:phone_num}});
//         // response.send("Thank You");
//         response.render('thankyou.hbs');
//
//     })
// });


app.get('/home/update/:name', function(request, response) {

    // var username = request.body.username;

    var db = utils.getDb();
    var user_name = request.params.name;
    db.collection('bank').find({username: user_name}).toArray((err, docs) => {
        if(err){
            console.log('Unable to get user');
        }
        response.render('update.hbs', {
        title: 'Home page',
        username: docs[0].username,
        password: docs[0].password,
        first_name: docs[0].first_name,
        last_name: docs[0].last_name,
        checkings: docs[0].checkings,
        savings: docs[0].savings,
        email: docs[0].email,
        phone_num: docs[0].phone_num,
        pages: ['account', 'currency', 'update']
        })
    })



    // response.render("update.hbs"), {
    //     username: request.params.name
    // };

});

app.post('/home/update/update/:name', function(request, response) {

    // var username = request.body.username;
    var db = utils.getDb();

    var pass_word = request.body.password;
    var first_name = request.body.first_name;
    var last_name = request.body.last_name;
    var email = request.body.email;
    var phone_num = request.body.phone_num;
    

    var user_name = request.params.name;
    
    db.collection('bank').find({username: user_name}).toArray((err, docs) => {
        if(err){
            console.log('Unable to get user');
        }
        db.collection('bank').update({username: user_name}, 
            {$set: 
                {username: user_name, 
            password: pass_word, 
            first_name: first_name, 
            last_name: last_name, 
            email: email, 
            phone_num: phone_num}});
        // response.send("Thank You");
        response.render('thankyou.hbs', {
            username: user_name,
        })


    })
});


app.del('/delUser', function (request, response) {
    var db = utils.getDb();
    db.collection('bank').remove({});
    db.collection('bank').find({}).toArray(function(err, result) {
        if (err) {
            response.send("Unable to delete student data")
        }
        response.send(JSON.stringify(result, undefined, 2))
    });

});

app.get('/all', function(request, response) {

    var db = utils.getDb();
    db.collection('bank').find({}).toArray((err, docs) => {
            if(err){
                console.log('Unable to get user');
            }
            // response.send("Found the following records" + docs);
            response.send(docs);
            // response.send('email',response.)

        }
    )
});


app.get(`/user/:name`, function(request, response) {

    var db = utils.getDb();
    var user_name = request.params.name;
    db.collection('bank').find({username: user_name}).toArray((err, docs) => {
            if(err){
                console.log('Unable to get user');
            }
            // response.send("Found the following records" + docs);
            //response.send(docs[0]);

        }
    )
});

app.get('/home/:name', function(request, response) {

    var db = utils.getDb();
    var user_name = request.params.name;
    db.collection('bank').find({username: user_name}).toArray((err, docs) => {
        if(err){
            console.log('Unable to get user');
        }
        response.render('homepage.hbs', {
        title: 'Home page',
        username: docs[0].username,
        password: docs[0].password,
        first_name: docs[0].first_name,
        last_name: docs[0].last_name,
        checkings: docs[0].checkings,
        savings: docs[0].savings,
        email: docs[0].email,
        phone_num: docs[0].phone_num,
        pages: ['account', 'currency', 'update']
        })

    })
    // response.sendFile(path.join(__dirname + '/homepage.html'));


    // var db = utils.getDb();



    // if (request.session.loggedin) {
    //     response.send('Welcome back, ' + request.session.username + '!');
    // } else {
    //     response.send('Please login to views this page!');
    // }
    // response.end();




});

app.get('/home/account/:name', function(request, response) {
var db = utils.getDb();
var user_name = request.params.name;
db.collection('bank').find({username: user_name}).toArray((err, docs) => {
    if(err){
        console.log('Unable to get user');
    }
    response.render('account_management.hbs', {
    title: 'Home page',
    username: docs[0].username,
    password: docs[0].password,
    first_name: docs[0].first_name,
    last_name: docs[0].last_name,
    checkings: docs[0].checkings,
    savings: docs[0].savings,
    email: docs[0].email,
    phone_num: docs[0].phone_num,
    pages: ['account_management', 'currency']
    })

})
});



app.get('/home/currency/:name', function(request, response) {


var db = utils.getDb();
var user_name = request.params.name;
db.collection('bank').find({username: user_name}).toArray((err, docs) => {
    if(err){
        console.log('Unable to get user');
    }
    response.render('currency.hbs', {
    title: 'Home page',
    username: docs[0].username,
    password: docs[0].password,
    first_name: docs[0].first_name,
    last_name: docs[0].last_name,
    checkings: docs[0].checkings,
    savings: docs[0].savings,
    email: docs[0].email,
    phone_num: docs[0].phone_num,
    pages: ['account_management', 'currency']
    })

})
});

app.get('/home/contact/:name', function(request, response) {


    var db = utils.getDb();
    var user_name = request.params.name;
    db.collection('bank').find({username: user_name}).toArray((err, docs) => {
        if(err){
            console.log('Unable to get user');
        }
        response.render('contact.hbs', {
            title: 'Home page',
            username: docs[0].username,
            password: docs[0].password,
            first_name: docs[0].first_name,
            last_name: docs[0].last_name,
            checkings: docs[0].checkings,
            savings: docs[0].savings,
            email: docs[0].email,
            phone_num: docs[0].phone_num,
            pages: ['account_management', 'currency', 'contact']
        })

    })
});

app.post('/home/currency/deposit/:name', function(request, response) {

    var db = utils.getDb();
    // var withdraw = request.body.withdraw;
    var deposit = Number(request.body.deposit);
    var user_name = request.params.name;

    db.collection('bank').find({username: user_name}).toArray((err, docs) => {
        if(err){
            console.log('Unable to get user');
        }

        var balance = docs[0].checkings;
        if (Number.isInteger(deposit)){
            var new_balance = parseInt(balance) + parseInt(deposit);
            db.collection('bank').update({username: user_name}, {$set: {checkings: new_balance}});
            response.render('thankyou.hbs', {
            username: user_name,
        });
        }
        else {
            response.render('error.hbs', {
                username: user_name
            })
        
        }
        // response.send("Thank You");
        

    })
    });


app.post('/home/currency/withdraw/:name', function(request, response) {

    var db = utils.getDb();
    var withdraw = request.body.withdraw;
    // var deposit = Number(request.body.deposit);
    var user_name = request.params.name;

    db.collection('bank').find({username: user_name}).toArray((err, docs) => {
        if(err){
            console.log('Unable to get user');
        }

        var balance = docs[0].checkings;
        if (Number.isInteger(parseInt(withdraw)) === false){
            response.render('error.hbs', {
                username: user_name
            })
           
        } else{
            var new_balance = parseInt(balance) - parseInt(withdraw);
            if (new_balance < 0) {
                response.render('error.hbs', {
                    username: user_name
                })
            }
            else {
                db.collection('bank').update({username: user_name}, {$set: {checkings: new_balance}});
                response.render('thankyou.hbs', {
                username: user_name,
            });
            }
    }
        // response.send("Thank You");
        

    })
});


// connection.connect(function(err) {
//     if (err) {
//         return console.error('error: ' + err.message);
//     }
//
//     console.log(`Connected to the Mongo server port ${port}`);
// });
//
//
// connection.end(function(err) {
//     if (err) {
//         return console.log('error:' + err.message);
//     }
//     console.log('Close the database connection.');
// });



//Load and initialize MessageBird SDK
var messagebird = require('messagebird')('test_gshuPaZoeEG6ovbc8M79w0QyM'); //Input message bird key here

//Set up and configure the Express framework
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');


//Display page to ask the user their phone number
app.get('/phone/:name', function(req, res) {
    var user_name = req.params.name;

    res.render(`step1`, {
        username: user_name
    });
});

//Handle phone number submission
app.post('/step2/:name', function(req, res) {
    var number = req.body.number;
    var user_name = req.params.name;

    //Make request to verify API
    messagebird.verify.create(number, {
        template: "Your verification code is %token."
    },function (err, response) {
        if(err) {
            //Request has failed
            console.log(err);
            res.render(`step1`,{
                error: err.errors[0].description,
                username: user_name
            });
        }
        else{
            //Request succeeds
            console.log(response);
            res.render(`step2`,{
                id: response.id,
                username: user_name
            });
        }
    })
});

//Verify whether the token is correct

app.post('/step3/:name', function(req, res) {
    var id = req.body.id;
    var token = req.body.token;
    var user_name = req.params.name;

    //Make request to verify API
    messagebird.verify.verify(id, token, function(err, response ) {
        if(err){
            //Verification has failed
            res.render('step2', {
                error: err.errors[0].description,
                id: id
            })
        } else {
            //Verification was successful ${username}
            res.redirect(`/home/${user_name}`);
        }
    })
});

//



