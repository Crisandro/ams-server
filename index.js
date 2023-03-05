const express = require('express')
const app = express()
const mysql = require('mysql')
const cors = require('cors')
//app.use(cors())
const bcrypt = require('bcrypt')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const cookieSession = require('cookie-session')
const store = require('store')
var cannotDelete = []
var Deletedarray = []


app.set('trust proxy', 1)
app.use(cookieSession({
    name: 'session',
    keys: ["theOGthesis"],

    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

app.use(express.json())

//app.use(express.urlencoded({extended: false}))


const corsOption = {
    origin: "https://crisandro.github.io",
    // origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
    optionsSuccessStatus: 200
}

app.use(cors(corsOption))


app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended : true }))
app.use(session({
    key: "user",
    secret: "theOGthesis",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    store: sessionStore,
    httpOnly: false,
    cookie: {
        secure: true, // required for cookies to work on HTTPS
        sameSite: 'none'
      }
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
    console.log(req.session.user)
})


app.post("/register",cors(corsOption), (req, res) => {
    const {firstname,lastname,username,password} = req.body;

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.log(err);
        }

        db.query(
        `INSERT INTO admin (username, password, firstname, lastname, adminthumbnails) VALUES ('${username}','${hash}','${firstname}','${lastname}','uploads/boys1.png')`,
        (err, result) => {
            
            db.query("SELECT * FROM `admin`",
            (err, result)=>{
                res.send({result: `${username} has been added`, database: result})
            })
        }
        );
    });
});

app.get("/login",cors(corsOption),(req,res)=>{
    if( req.session.user ){
        // res.send({ loggedIn: true, user: req.session.user })
        res.send({ loggedIn: true, user: store.get('user') })
        //console.log( store.get('user') )
    } else {
        res.send({ loggedIn: false })
    }
})



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
                    store.set('user',{result})
                    req.session.user = result;
                    res.send({ loggedIn: true , result })
                    //console.log(req.session.user)
                } else {
                    res.send({ message: "Wrong username/password combination!" , loggedIn: false });
                }
                });
            } else {
                res.send({ message: "User doesn't exist" , loggedIn: false })
            }
        }
    );
});

app.post("/logout",cors(corsOption),(req,res)=>{
    req.session = null
    res.send({ loggedIn: false })
})

app.post("/api/addDevice",cors(corsOption),(req,res)=>{
    const {dev_id,dev_brand,dev_serial,dev_model,dev_desc} = req.body;
    const queryAdd = `INSERT INTO stdevice VALUES(null,'${dev_id}','${dev_desc}','${dev_serial}','${dev_brand}','${dev_model}','Available','')`
    db.query( queryAdd , (err, result) => {
        res.send({result: `new device has been added`})
    })
})

app.post("/api/addDeviceName",cors(corsOption),(req,res)=>{
    const dev_name = req.body.dev_name;
    const queryAdd = `INSERT INTO device_name (dev_name) VALUES ('${dev_name}')`
    db.query( queryAdd , (err, result) => {
        const viewAlldevice = "SELECT * FROM device_name"
        db.query(viewAlldevice,(err, result)=>{
            res.send({result: `${dev_name} has been added`, devList: result})
        })
    })
})

app.post("/api/deleteDeviceName",cors(corsOption),(req,res)=>{
    const dev_name = req.body;
    
    dev_name.map(ids => {
        const checkFirst = `SELECT * FROM stdevice LEFT JOIN device_name ON stdevice.dev_id=device_name.dev_id where device_name.dev_id = ${ids}`
        db.query(checkFirst,(err, result)=>{
            if(result.length > 0 ){
                cannotDelete.push(result[0].dev_name)
            }else{
                Deletedarray.push(ids)
            }
        })
    })

    const viewAlldevice = "SELECT * FROM device_name"
    db.query(viewAlldevice,(err, result)=>{
        res.send({result: result, notDelete:cannotDelete, fordeleteIds:Deletedarray})
    })
    cannotDelete = []
    Deletedarray = []
})

app.get("/api/query",cors(corsOption),(req,res)=>{
    db.query("SELECT * FROM stdevice LEFT JOIN device_name ON stdevice.dev_id=device_name.dev_id WHERE dev_status='Available' and assigned_set='' ORDER BY stdevice.id DESC",(err, result)=>{
        res.send(result)
    })
})

app.get("/location",cors(corsOption),(req,res)=>{
    const viewAlldevice = "SELECT * FROM stlocation"
    db.query(viewAlldevice,(err, result)=>{
        res.send(result)
    })
})

app.get("/availableItems",cors(corsOption),(req,res)=>{
    const viewAlldevice = "SELECT * FROM stdevice LEFT JOIN device_name ON stdevice.dev_id=device_name.dev_id where dev_status='Available'"
    db.query(viewAlldevice,(err, result)=>{
        res.send(result)
    })
})

app.get("/stdevices",cors(corsOption),(req,res)=>{
    const viewAlldevice = "SELECT * FROM stdevice LEFT JOIN device_name ON stdevice.dev_id=device_name.dev_id"
    db.query(viewAlldevice,(err, result)=>{
        res.send(result)
    })
})

app.get("/devicename",cors(corsOption),(req,res)=>{
    const viewAlldevice = "SELECT * FROM device_name"
    db.query(viewAlldevice,(err, result)=>{
        res.send(result)
    })
})

app.post("/devicenameValues",cors(corsOption),(req,res)=>{
    const dev_ids = req.body;

    const viewAlldevice = `SELECT * FROM device_name WHERE dev_id IN ( ${dev_ids} )`
    db.query(viewAlldevice,(err, getRes)=>{
        res.send(getRes)
    })
})

app.post("/confirmDeleteDeviceType",cors(corsOption),(req,res)=>{
    const dev_ids = req.body;
    console.log(dev_ids)

    const querydelete = `DELETE FROM device_name WHERE dev_id IN (${dev_ids})`
    db.query( querydelete , (err, result) => {
        console.log(`${dev_ids} deleted `)
        db.query("SELECT * FROM device_name",(err, result)=>{
            res.send(result)
        })
    })
})

app.get("/getSystemUsers",cors(corsOption),(req,res)=>{
    const viewAlluser = "SELECT admin_id, firstname, lastname, username FROM admin"
    db.query(viewAlluser,(err, Result)=>{
        res.send(Result)
    })
})

app.post("/getSystemUsersName",cors(corsOption),(req,res)=>{
    const user_ids = req.body;
    const viewAlluser = `SELECT admin_id, firstname, username FROM admin WHERE admin_id IN (${user_ids})`
    db.query(viewAlluser,(err, Result)=>{
        res.send(Result)
    })
})

app.post("/deleteSystemUsersName",cors(corsOption),(req,res)=>{
    const user_ids = req.body;

    const viewAlluser = `DELETE FROM admin WHERE admin_id IN (${user_ids})`
    db.query(viewAlluser,(err, Result)=>{
        db.query("SELECT admin_id, firstname, username FROM admin",(err, Result)=>{
            res.send(Result)
        })
    })
})

app.get("/getActivityLogs",cors(corsOption),(req,res)=>{
    const viewAllactivitylog = "SELECT * FROM activity_log"
    db.query(viewAllactivitylog,(err, Result)=>{
        res.send(Result)
    })
})

app.get("/getUserLogs",cors(corsOption),(req,res)=>{
    const viewAlluserlog = "SELECT * FROM user_log"
    db.query(viewAlluserlog,(err, Result)=>{
        res.send(Result)
    })
})

const port = process.env.PORT || 3001

app.listen(port, ()=> {
    console.log("running on port 3001")
})