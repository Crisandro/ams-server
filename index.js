const express = require('express')
const app = express()
const mysql = require('mysql')
const cors = require('cors')
const sessionId = require('express-session-id')
const { v4: uuidv4 } = require('uuid')
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

// app.use(sessionId({
//     idleTime: 24 * 60 * 1000 * 60, // 10 minutes
// }))

app.use(session({
    genid: function(req) {
        return uuidv4() // use UUIDs for session IDs
    },
    key: "user",
    secret: "theOGthesis",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    httpOnly: false,
    cookie: {
        secure: true, // required for cookies to work on HTTPS
        sameSite: 'none'
    }
}))

app.get('/',cors(corsOption),(req,res)=>{
    res.send({ sessionID : req.session.id})
    
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
                const queryAddlog = `INSERT INTO activity_log (activity_log_id, username, date, action) VALUES (null, '${req.session.user[0].username}',now(),'Added new user: ${username}' )`
                db.query( queryAddlog , (err, result) => {})
                res.send({result: `${username} has been added`, database: result})
            })
        }
        );
    });
});

app.get("/login",cors(corsOption),(req,res)=>{
    if( req.session.user ){
         res.send({ loggedIn: true, user: req.session.user })
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
                    req.session.user = result
                    req.session.id = uuidv4()
                    const queryAdduserlog = `INSERT INTO user_log (user_log_id, username, login_date, logout_date, admin_id, client_id) VALUES (null, '${username}', now(), null, '${result[0].admin_id}', '${req.session.id}' )`
                    db.query( queryAdduserlog , (err, result) => {})
                    res.send({ loggedIn: true , result })
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
    const queryAdduserlog = `UPDATE user_log SET logout_Date = now() WHERE client_id = '${req.session.id}' `
    db.query( queryAdduserlog , (err, result) => {})
    req.session = null
    res.send({ loggedIn: false })
})

app.post("/api/addDevice",cors(corsOption),(req,res)=>{
    const {dev_id,dev_brand,dev_serial,dev_model,dev_desc} = req.body

    const queryAddlog = `INSERT INTO activity_log (activity_log_id, username, date, action) VALUES (null, '${req.session.user[0].username}',now(),'Added a new device with a Serial number ${dev_serial}' )`
    db.query( queryAddlog , (err, result) => {})

    const queryAdd = `INSERT INTO stdevice VALUES(null,'${dev_id}','${dev_desc}','${dev_serial}','${dev_brand}','${dev_model}','Available','')`
    db.query( queryAdd , (err, result) => {
        res.send({result: `new device has been added`})
    })
})

app.post("/api/addDeviceName",cors(corsOption),(req,res)=>{
    const {dev_name, currentUser} = req.body

    const queryAdd = `INSERT INTO device_name (dev_name) VALUES ('${dev_name}')`
    db.query( queryAdd , (err, result) => {})

    const queryAddlog = `INSERT INTO activity_log (activity_log_id, username, date, action) VALUES (null, '${currentUser}',now(),'Created new device type ${dev_name}' )`
    db.query( queryAddlog , (err, result) => {})

    const viewAlldevice = "SELECT * FROM device_name"
    db.query(viewAlldevice,(err, result)=>{
        res.send({result: `${dev_name} has been added`, devList: result})
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

    const querydelete = `DELETE FROM device_name WHERE dev_id IN (${dev_ids})`
    db.query( querydelete , (err, result) => {})

    const queryAddlog = `INSERT INTO activity_log (activity_log_id, username, date, action) VALUES (null, '${req.session.user[0].username}',now(),'Delete Device Types with the ID(s) of: ${dev_ids}' )`
    db.query( queryAddlog , (err, result) => {})

    db.query("SELECT * FROM device_name",(err, result)=>{
        res.send(result)
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
    const user_ids = req.body

    const viewfromuser = `SELECT * FROM admin WHERE admin_id IN (${user_ids})`
    db.query(viewfromuser,(err, Result)=>{
        var selected = Result.map( users => " " + users.username)
        const queryAddlog = `INSERT INTO activity_log (activity_log_id, username, date, action) VALUES (null, '${req.session.user[0].username}',now(),'Delete users: ${selected}' )`
        db.query( queryAddlog , (err, result) => {})
    })

    const deletefromuser = `DELETE FROM admin WHERE admin_id IN (${user_ids})`
    db.query(deletefromuser,(err, Result)=>{})

    db.query("SELECT admin_id, firstname, username FROM admin",(err, Result)=>{
        res.send(Result)
    })
})

app.get("/location",cors(corsOption),(req,res)=>{
    const viewAlllocations = "SELECT * FROM stlocation"
    db.query(viewAlllocations,(err, result)=>{
        res.send(result)
    })
})

app.post("/selectedLocationName",cors(corsOption),(req,res)=>{
    const location_ids = req.body
    
    const viewlocations = `SELECT * FROM location_details WHERE stdev_id IN (${location_ids})`
    db.query(viewlocations,(err, result)=>{
        if(result.length > 0){
            cannotDelete.push(result.map( datas => { datas.stdev_id}))
            // res.send({notDelete: result.data.id, fordeleteIds:[]})
            var ids = result.map( datas => { datas.stdev_id})
            console.log( result.map( datas => datas.stdev_id ) )
            res.send({notDelete: result.map( datas => datas.stdev_id ), fordeleteIds: []})
        }else{
            res.send({notDelete: [], fordeleteIds: location_ids})
        }
    })

    
    // res.send({notDelete: cannotDelete, fordeleteIds:Deletedarray})

    // cannotDelete = []
    // Deletedarray = []
})

// app.post("/locationNameValues",cors(corsOption),(req,res)=>{
//     const location_ids = req.body
//     const nameofLocations = `SELECT stdev_location_name FROM stlocation WHERE stdev_id IN (${location_ids})`
//     db.query(nameofLocations,(err, result)=>{
//         res.send(result)
//     })
// })

app.post("/deleteLocationName",cors(corsOption),(req,res)=>{
    const location_ids = req.body

    const viewAlllocation = `SELECT * FROM stlocation where stdev_id IN (${location_ids})`
    db.query(viewAlllocation,(err, result)=>{
        var selected = result.map( locations => " " + locations.stdev_location_name )
        console.log(selected.toString())
        const queryAddlog = `INSERT INTO activity_log (activity_log_id, username, date, action) VALUES (null, '${req.session.user[0].username}',now(),'Deleted Location(s): ${selected.toString()}' )`
        db.query( queryAddlog , (err, result) => {})
    })

    const deletelocations = `DELETE FROM stlocation WHERE stdev_id IN (${location_ids})`
    db.query(deletelocations,(err, result)=>{})

    const viewAlllocations = `SELECT * FROM stlocation`
    db.query(viewAlllocations,(err, result)=>{
        res.send({message: "Location successfully Deleted! ", Result: result})
    })

})

app.post("/addLocations",cors(corsOption),(req,res)=>{
    const location_name = req.body.location_name

    const inserintolocations = `INSERT INTO stlocation (stdev_id, stdev_location_name, thumbnails) VALUES (null, '${location_name}', 'images/thumbnails.jpg')`
    db.query(inserintolocations,(err, Result)=>{})

    const queryAddlog = `INSERT INTO activity_log (activity_log_id, username, date, action) VALUES (null, '${req.session.user[0].username}',now(),'Added new Location name ${location_name}' )`
    db.query( queryAddlog , (err, result) => {})

    const viewAlllocations = "SELECT * FROM stlocation"
    db.query(viewAlllocations,(err, Result)=>{
        res.send({message: `successfully added ${location_name} location.`,Result: Result})
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