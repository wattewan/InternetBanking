const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const bodyParser = require('body-parser');
const port = process.env.PORT || 8080;
const hbs = require('hbs');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const session = require('express-session');
const crypto = require('crypto');
const request = require('request');
const saltRounds = 10;

const clientId = "";
const clientSecret = "";
const accessToken = "";
const refreshToken = "";

var exphbs = require('express-handlebars');
var path = require('path');
var utils = require('./mongo_init.js');
var db = utils.getDb();


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
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', function (request, response) {

    // var db = utils.getDb();
    response.sendFile(path.join(__dirname + '/login.html'));
});

app.post('/auth', function (request, response) {
    // var id = request.body.id;
    // var name = request.body.name;
    // var email = request.body.email;

    var db = utils.getDb();
    var username = request.body.username;
    var password = request.body.password;

    if (username && password) {
        db.collection('bank').find({ username: username }).toArray(function (err, result) {

            let verify = bcrypt.compareSync(password, result[0].password);

            let confirmed = false;
            if (result[0].verified === true) {
                confirmed = true;
            }
            if (verify && confirmed) {
                request.session.user = {
                    username: result[0].username,
                    password: result[0].password,
                    first_name: result[0].first_name,
                    last_name: result[0].last_name,
                    checkings: result[0].checkings,
                    savings: result[0].savings,
                    email: result[0].email,
                    phone_num: result[0].phone_num,
                    token: result[0].token,
                    tokenExpire: result[0].tokenExpire,
                    confirmToken: result[0].confirmToken,
                    verified: result[0].verified
                };

                response.redirect(`/home/${username}`);
            } else if (!verify) {
                response.send('Incorrect Username and/or Password!');
            } else if (verify && !confirmed) {
                response.send('Please verify your account through the email sent to your address.');
            }

            response.end();
        })
    } else {
        response.send('Please enter Username and Password!');
        response.end();
    }
});

app.get('/register', function (request, response) {
    response.render('account_create.hbs')
});

app.post('/saveUser', function (request, response) {

    var username = request.body.username;
    var password = request.body.password;
    var repassword = request.body.repassword;
    if (password != repassword) {
        response.send('Passwords must match');
    } else {
        password = bcrypt.hashSync(password, saltRounds);
        var first_name = request.body.first_name;
        var last_name = request.body.last_name;
        var checkings = 0;
        var savings = 0;
        var email = request.body.email;
        var phone_num = request.body.phone_num;
        var token = "";
        var tokenExpire = "";
        var confirmToken = "";
        var total_balance = request.body.checkings + request.body.checkings;

        var db = utils.getDb();
        let create = true;
        let goodEmail = true;
        let goodUsername = true;

        db.collection('bank').find({
            email: email
        }).toArray(function (err, result) {
            if (result[0] != null) {
                response.render('basic_response.hbs', {
                    h1: 'Email in use'
                })
                create = false;
            }
        });


        db.collection('bank').find({
            username: username
        }).toArray(function (err, result) {
            if (result[0] == null && create == true) {
                db.collection('bank').insertOne({
                    username: username,
                    password: password,
                    first_name: first_name,
                    last_name: last_name,
                    checkings: checkings,
                    savings: savings,
                    email: email,
                    phone_num: phone_num,
                    token: token,
                    tokenExpire: tokenExpire,
                    confirmToken: confirmToken,
                    verified: false
                }, (err, result) => {
                    if (err) {
                        create = false;
                        console.log('Unable to insert user');
                        response.send('Unable to create user');
                    }
                    //response.send(JSON.stringify(result.ops, undefined, 2));
                    if (create === true) {
                        response.redirect('/confirm-account');
                    }
                })
            } else {
                response.render('basic_response.hbs', {
                    h1: 'Username in use'
                });
            }
        });
        }
    }
);

app.get('/confirm-account', function (request, response) {

    var db = utils.getDb();

    response.render('confirm_account.hbs')

});

app.post('/create-account', function (request, response) {

    var db = utils.getDb();
    var email = request.body.email;
    var confirmToken;

    db.collection('bank').find({
        email: email
    }).toArray(function (err, result) {

        if (!result[0]) {
            response.render('basic_response.hbs', {
                h1: 'No registered account with specified email address'
            });
        } else {

            request.session.user = {
                username: result[0].username,
                password: result[0].password,
                first_name: result[0].first_name,
                last_name: result[0].last_name,
                checkings: result[0].checkings,
                savings: result[0].savings,
                email: result[0].email,
                phone_num: result[0].phone_num,
                token: result[0].token,
                tokenExpire: result[0].tokenExpire,
                confirmToken: result[0].confirmToken,
                verified: result[0].verified
            };


            crypto.randomBytes(15, function (err, buf) {
                confirmToken = buf.toString('hex');

                db.collection('bank').updateOne(
                    { email: email },
                    {
                        $set: {
                            confirmToken: confirmToken,
                        }
                    }
                );

                request.session.user.confirmToken = confirmToken;
                request.session.save(function (err) {
                    if (err) {
                        console.log(err)
                    }
                });
            });

            var auth = {
                type: 'oauth2',
                user: 'internetbanking.node@gmail.com',
                clientId: clientId,
                clientSecret: clientSecret,
                refreshToken: refreshToken,
                accessToken: accessToken
            };

            db.collection('bank').find({
                email: email
            }).toArray(function (err, result) {
                var mailOptions = {
                    to: result[0].email,
                    from: 'internetbanking.node@gmail.com',
                    subject: 'Account Creation Confirmation',
                    text: 'Click the following link to confirm your account and complete your registration. \n' +
                        'localhost:8080' + '/confirm/' + request.session.user.confirmToken,
                    auth: {
                        user: 'internetbanking.node@gmail.com',
                        refreshToken: refreshToken,
                        accessToken: accessToken
                    }
                };

                console.log(request.session.user.confirmToken);

                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: auth
                });

                transporter.sendMail(mailOptions, (err, response) => {
                    if (err) {
                        console.log(err);
                    }
                });

                if (err) {
                    console.log(err);
                } else {
                    response.render('basic_response.hbs', {
                        h1: 'A confirmation email has been sent'
                    });
                }
            });
        }
    });

});

app.get('/confirm/:confirmToken', function (request, response) {

    var db = utils.getDb();

    db.collection('bank').find({
        confirmToken: request.params.confirmToken
    }).toArray(function (err, result) {
        if (result[0] != null) {
            db.collection('bank').updateOne(
                { confirmToken: request.params.confirmToken },
                {
                    $set: {
                        verified: true
                    }
                }
            );
            response.render('basic_response.hbs', {
                h1: 'Account Verified',
                message: 'You are now able to log in.'
            });
        } else {
            response.render('basic_response.hbs', {
                h1: 'Invalid Token',
                message: 'You have provided an invalid token. No changes have been made.'
            });
        }
    });

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


app.get('/home/update/:name', function (request, response) {

    // var username = request.body.username;

    var db = utils.getDb();
    var user_name = request.params.name;
    db.collection('bank').find({ username: user_name }).toArray((err, docs) => {
        if (err) {
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

app.post('/home/update/update/:name', function (request, response) {

    // var username = request.body.username;
    var db = utils.getDb();

    var pass_word = request.body.password;
    var first_name = request.body.first_name;
    var last_name = request.body.last_name;
    var email = request.body.email;
    var phone_num = request.body.phone_num;


    var user_name = request.params.name;

    db.collection('bank').find({ username: user_name }).toArray((err, docs) => {
        if (err) {
            console.log('Unable to get user');
        }
        db.collection('bank').update({ username: user_name },
            {
                $set:
                {
                    username: user_name,
                    password: pass_word,
                    first_name: first_name,
                    last_name: last_name,
                    email: email,
                    phone_num: phone_num
                }
            });
        // response.send("Thank You");
        response.render('thankyou.hbs', {
            username: user_name,
        })


    })
});


app.del('/delUser', function (request, response) {
    var db = utils.getDb();
    db.collection('bank').remove({});
    db.collection('bank').find({}).toArray(function (err, result) {
        if (err) {
            response.send("Unable to delete student data")
        }
        response.send(JSON.stringify(result, undefined, 2))
    });

});

app.get('/all', function (request, response) {

    var db = utils.getDb();
    db.collection('bank').find({}).toArray((err, docs) => {
        if (err) {
            console.log('Unable to get user');
        }
        // response.send("Found the following records" + docs);
        response.send(docs);
        // response.send('email',response.)

    }
    )
});


app.get(`/user/:name`, function (request, response) {

    var db = utils.getDb();
    var user_name = request.params.name;
    db.collection('bank').find({ username: user_name }).toArray((err, docs) => {
        if (err) {
            console.log('Unable to get user');
        }
        // response.send("Found the following records" + docs);
        //response.send(docs[0]);

    }
    )
});

app.get('/home/:name', function (request, response) {

    var db = utils.getDb();
    var user_name = request.params.name;
    db.collection('bank').find({ username: user_name }).toArray((err, docs) => {
        if (err) {
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

app.get('/home/account/:name', function (request, response) {
    var db = utils.getDb();
    var user_name = request.params.name;
    db.collection('bank').find({ username: user_name }).toArray((err, docs) => {
        if (err) {
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



app.get('/home/currency/:name', function (request, response) {


    var db = utils.getDb();
    var user_name = request.params.name;
    db.collection('bank').find({ username: user_name }).toArray((err, docs) => {
        if (err) {
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

app.get('/home/contact/:name', function (request, response) {


    var db = utils.getDb();
    var user_name = request.params.name;
    db.collection('bank').find({ username: user_name }).toArray((err, docs) => {
        if (err) {
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

app.post('/home/currency/deposit/:name', function (request, response) {

    var db = utils.getDb();
    // var withdraw = request.body.withdraw;
    var deposit = Number(request.body.deposit);
    var user_name = request.params.name;

    db.collection('bank').find({ username: user_name }).toArray((err, docs) => {
        if (err) {
            console.log('Unable to get user');
        }

        var balance = docs[0].checkings;
        if (Number.isInteger(deposit)) {
            var new_balance = parseInt(balance) + parseInt(deposit);
            db.collection('bank').update({ username: user_name }, { $set: { checkings: new_balance } });
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


app.post('/home/currency/withdraw/:name', function (request, response) {

    var db = utils.getDb();
    var withdraw = request.body.withdraw;
    // var deposit = Number(request.body.deposit);
    var user_name = request.params.name;

    db.collection('bank').find({ username: user_name }).toArray((err, docs) => {
        if (err) {
            console.log('Unable to get user');
        }

        var balance = docs[0].checkings;
        if (Number.isInteger(parseInt(withdraw)) === false) {
            response.render('error.hbs', {
                username: user_name
            })

        } else {
            var new_balance = parseInt(balance) - parseInt(withdraw);
            if (new_balance < 0) {
                response.render('error.hbs', {
                    username: user_name
                })
            }
            else {
                db.collection('bank').update({ username: user_name }, { $set: { checkings: new_balance } });
                response.render('thankyou.hbs', {
                    username: user_name,
                });
            }
        }
        // response.send("Thank You");


    })
});

app.get('/reset-password', function (request, response) {
    response.render('pass_reset.hbs');
});

app.post('/reset', function (request, response) {

    var db = utils.getDb();
    var email = request.body.email;
    var token;

    db.collection('bank').find({
        email: email
    }).toArray(function (err, result) {

        if (!result[0]) {
            response.render('basic_response.hbs', {
                h1: 'No registered account with specified email address'
            });
        } else {

            request.session.user = {
                username: result[0].username,
                password: result[0].password,
                first_name: result[0].first_name,
                last_name: result[0].last_name,
                checkings: result[0].checkings,
                savings: result[0].savings,
                email: result[0].email,
                phone_num: result[0].phone_num,
                token: result[0].token,
                tokenExpire: result[0].tokenExpire
            };

            crypto.randomBytes(15, function (err, buf) {
                token = buf.toString('hex');

                db.collection('bank').updateOne(
                    { email: email },
                    {
                        $set: {
                            token: token,
                            tokenExpire: Date.now() + 3600
                        }
                    }
                );

                request.session.user.token = token;
                request.session.user.tokenExpire = Date.now() + 3600
                request.session.save(function (err) {
                    if (err) {
                        console.log(err)
                    }
                });
            });

            var auth = {
                type: 'oauth2',
                user: 'internetbanking.node@gmail.com',
                clientId: clientId,
                clientSecret: clientSecret,
                refreshToken: refreshToken,
                accessToken: accessToken
            };

            db.collection('bank').find({
                email: email
            }).toArray(function (err, result) {
                var mailOptions = {
                    to: result[0].email,
                    from: 'internetbanking.node@gmail.com',
                    subject: 'Password Reset',
                    text: 'The account linked to this email has requested a password reset. Click the following link and enter a new password. \n' +
                        'localhost:8080' + '/reset/' + request.session.user.token,
                    auth: {
                        user: 'internetbanking.node@gmail.com',
                        refreshToken: refreshToken,
                        accessToken: accessToken
                    }
                };

                console.log(request.session.user.token);

                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: auth
                });

                transporter.sendMail(mailOptions, (err, response) => {
                    if (err) {
                        console.log(err);
                    }
                });

                if (err) {
                    console.log(err);
                } else {
                    response.render('basic_response.hbs', {
                        h1: 'An email has been sent'
                    });
                }
            });
        }
    }
    )
});

app.get('/reset/:token', function (request, response) {
    var db = utils.getDb();

    db.collection('bank').find({
        token: request.params.token
    }).toArray(function (err, result) {
        if (result[0] == null) {
            response.render('basic_response.hbs', {
                h1: 'Invalid Token'
            });
        } else {
            response.render('reset.hbs', {
                username: result[0].username
            });
        }
    });
});

app.post('/reset/:token', function (request, response) {
    var db = utils.getDb();

    var password = request.body.password;
    password = bcrypt.hashSync(password, saltRounds);

    db.collection('bank').find({
        token: request.params.token
    }).toArray(function (err, result) {
        if (result[0] != null) {
            db.collection('bank').updateOne(
                { token: request.params.token },
                {
                    $set: {
                        password: password
                    }
                }
            )
            response.render('basic_response.hbs', {
                h1: 'Password Reset',
                message: 'The password has been succesfully updated.'
            });
            console.log(result[0].password)
        } else {
            response.render('basic_response.hbs', {
                h1: 'Invalid Token',
                message: 'You have provided an invalid token. No changes have been made.'
            });
        }
    })
});


// connection.connect(function(err) {
//     if (err) {
//         return console.error('error: ' + err.message);
//     }

//     console.log(`Connected to the Mongo server port ${port}`);
// });


// connection.end(function(err) {
//     if (err) {
//         return console.log('error:' + err.message);
//     }
//     console.log('Close the database connection.');
// });

//Load and initialize MessageBird SDK
// var messagebird = require('messagebird')('nXHHvxdfonv5EegEe323A1Gv1'); //Input message bird key here
//
// //Set up and configure the Express framework
// app.engine('handlebars', exphbs({defaultLayout: 'main'}));
// app.set('view engine', 'handlebars');
//
//
// //Display page to ask the user their phone number
// app.get('/phone/:name', function(req, res) {
//     var user_name = req.params.name;
//
//     res.render(`step1`, {
//         username: user_name
//     });
// });
//
// //Handle phone number submission
// app.post('/step2/:name', function(req, res) {
//     var number = req.body.number;
//     var user_name = req.params.name;
//
//     //Make request to verify API
//     messagebird.verify.create(number, {
//         template: "Your verification code is %token."
//     },function (err, response) {
//         if(err) {
//             //Request has failed
//             console.log(err);
//             res.render(`step1`,{
//                 error: err.errors[0].description,
//                 username: user_name
//             });
//         }
//         else{
//             //Request succeeds
//             console.log(response);
//             res.render(`step2`,{
//                 id: response.id,
//                 username: user_name
//             });
//         }
//     })
// });
//
// //Verify whether the token is correct
//
// app.post('/step3/:name', function(req, res) {
//     var id = req.body.id;
//     var token = req.body.token;
//     var user_name = req.params.name;
//
//     //Make request to verify API
//     messagebird.verify.verify(id, token, function(err, response ) {
//         if(err){
//             //Verification has failed
//             res.render('step2', {
//                 error: err.errors[0].description,
//                 id: id
//             })
//         } else {
//             //Verification was succe${username}
//             res.redirect(`/home/${user_name}`);
//         }
//     })
// });
//
// //


module.exports = app, utils, db;
