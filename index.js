const express = require('express')
const app = express()
const mysql = require('mysql')
const cors = require('cors')
const bcrypt = require('bcrypt')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const session = require('express-session')

app.use(express.json())
//app.use(express.urlencoded({extended: false}))

const corsOption = {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
    optionsSuccessStatus: 200
}

app.use(
    cors({
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
      optionsSuccessStatus: 200
    })
)
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended : true }))
app.use(session({
    key: "userId",
    secret: "theOGthesis",
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 60 * 60 * 24,
    },
}))

  // Add Access Control Allow Origin headers
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});

const db = mysql.createConnection({
    user: "theogthesis",
    host: "db4free.net",
    password: "theogthesisdatabase",
    database: "amsthesis",
})


app.get('/',cors(corsOption),(req,res)=>{
    const viewAllData = "SELECT * FROM device_name"
    db.query(viewAllData,(err, result)=>{
        res.json(result)
    })
})


app.post("/register",cors(corsOption), (req, res) => {
    const {username,password,fname,lname} = req.body;

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
        console.log(err);
        }

        db.query(
        `INSERT INTO admin (username, password, firstname, lastname, adminthumbnails) VALUES ('${username}','${hash}','${fname}','${lname}','uploads/boys1.png')`,
        (err, result) => {
            res.send({result: `${username} has been added`})
            //res.json(result)
        }
        );
    });
});

app.post("/login",cors(corsOption), (req, res) => {
    const {username, password}= req.body;

    db.query(
        `SELECT * FROM admin WHERE username = '${username}'`,
        (err, result) => {
            if (err) {
                res.send({ err: err });
            }

            if (result.length > 0) {
                bcrypt.compare(password, result[0].password, (error, response) => {
                if (response) {
                    req.session.user = result;
                    res.send({ loggedIn: true , result });
                } else {
                    res.send({ message: "Wrong username/password combination!" , loggedIn: false });
                }
                });
            } else {
                res.send({ message: "User doesn't exist" , loggedIn: false });
            }
        }
    );
});

app.get("/login",cors(corsOption),(req,res)=>{
    if( req.session.user ){
        res.send({ loggedIn: true, user: req.session.user })
    } else {
        res.send({ loggedIn: false })
    }
})

app.post("/logout",cors(corsOption),(req,res)=>{
    req.session.destroy()
    res.send({ loggedIn: false })
})

app.listen(crisandro.github.io/ams-server, ()=> {
    console.log("running on port 3001")
})