var express = require("express")
var app = express()
var server = require("https")
var fs = require("fs")
var path = require("path")
var socketCalling = require("socket.io")

// the voice only can be transmitted from A to B with a certification of security
const serverCalling = server.createServer({
    cert: fs.readFileSync('./ssl/certi.crt'),
    key: fs.readFileSync('./ssl/ssl-server-k.key'),
    Headers: {
        'Access-Control-Allow-Origin':'*'
    }
}, app.use("/static", express.static(__dirname))).listen(4041, ()=>{
    app.use(express.static(parsePath("", "Server-caller", "public")))
    var IP_ADDRESS_CONNECTION = fs.readFileSync('../own-packages/connection/parameterConnection.txt', 'utf-8', (err, data)=>{
        if(err) {
            console.log(err)
            return
        }
        return data  
    })
    console.log("")
    console.log("------------------ Yucall-Server is running: https://" + IP_ADDRESS_CONNECTION + ":4041 ------------------")
    console.log("")
})
// socket listening
socketIoListening = socketCalling(serverCalling)

socketIoListening.on('connection',(socketConnection)=>{
    console.log("Se ha detectado una nueva conexión")
    // through this event is retransmitted the voice or audio sent by the doctor to the cliente
    socketConnection.on("data-for-receivers", (voice, placeName)=>{
        socketIoListening.emit("data-for-receivers", voice, placeName)
    })
    socketConnection.on("state-playing-voice", (stateVoice, hash)=>{
        socketIoListening.emit("state-playing-voice", stateVoice, hash)
    })
    socketConnection.on("ping-connection-test", ()=> {
        socketIoListening.emit("test-connection")
    })
    socketConnection.on("request-message-ping", (data)=> {
        socketIoListening.emit("request-from-panel-patient", data)
    })
})
function serveStaticFilesAndGetApp() {
    app.get("/", (request, response)=> {
        template = parsePath("patientApp.html", "Server-caller", "YuCallPatient")
        response.sendFile(template) 
    })
    app.get("/app", (request, response)=> {
        template = parsePath("index.html", "Server-caller", "YuCallDoctor")
        response.sendFile(template) 
    })
    // styles for panelDoctor.js
    app.use("/styles-doctor-app", (req,res)=>{
      res.sendFile(parsePath("styles-app\\index.css", "Server-caller", "public"))
    })
    // styles for panelPatient.js
    app.use("/styles-patient-app", (req,res)=>{
        res.sendFile(parsePath("styles-app\\patient.css", "Server-caller", "public"))
      })
    // code js for panelDoctor.js
    app.use("/code-doctor-app", (req, res)=> {
        res.sendFile(parsePath("code-app\\panelDoctor.js", "Server-caller", "public"))
    })
    app.use("/code-patient-app", (req, res)=> {
        res.sendFile(parsePath("code-app\\panelPatient.js", "Server-caller", "public"))
    })
    app.use("/images", (req, res)=> {
        res.sendFile(parsePath("images\\logo.png", "Server-caller", "public"))
    })
    app.use("/images-1", (req, res)=> {
        res.sendFile(parsePath("images\\logo-blue.png", "Server-caller", "public"))
    })
    app.use("/img-loading", (req, res)=> {
        res.sendFile(parsePath("images\\loading.gif", "Server-caller", "public"))
    })
    app.use("/img-man", (req, res)=> {
        res.sendFile(parsePath("images\\man-icon.png", "Server-caller", "public"))
    })
    app.use("/img-woman", (req, res)=> {
        res.sendFile(parsePath("images\\woman-icon.png", "Server-caller", "public"))
    })
    app.use("/sound-alert", (req, res)=> {
        res.sendFile(parsePath("sounds\\notification-calling-patient.mp3", "Server-caller", "public"))
    })
    app.use("/consulting-room", (req, res)=> {
        res.sendFile(parsePath("images\\consulting-room-icon-1.png", "Server-caller", "public"))
    })
    app.use("/medic-icon", (req, res)=> {
        res.sendFile(parsePath("images\\medic-icon-1.png", "Server-caller", "public"))
    })
    app.use("/main-app-icon", (req, res)=> {
        res.sendFile(parsePath("images\\Yucaller-Icon.ico", "Server-caller", "public"))
    })
}
// function that parses the path deleting the server folder and joining it with the folder and the filename.html that we want to send to client
function parsePath(filename, pathReplace, pathFolder) {
    var rootPath = __dirname.replace(pathReplace, '')
    return path.join(rootPath,pathFolder,filename)
}
serveStaticFilesAndGetApp()