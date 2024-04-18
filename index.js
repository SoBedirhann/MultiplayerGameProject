const express = require("express");
const cors = require("cors");
const app = express();
const http = require("http");
const port = 3000;

app.set("view engine", "ejs");

// Define a route to handle requests to the root URL
app.get("/", (req, res) => {
    //res.sendfile('index.html');
    res.render('index', {name:'emre',surname:'ekiz'});
});
app.use(cors({
    origin: "http://localhost:3000",
}));
// Serve static files from the 'public' directory
app.use(express.static("public"));

// Serve the Socket.IO client library
app.use(
    "/socket.io",
    express.static(__dirname + "/node_modules/socket.io/client-dist")
);

//app.listen(port, () => {
//    console.log(`Example app listening on port ${port}`);
//});

var server = http.createServer(app);
const socketIo = require("socket.io");
const io = socketIo(server);
const gameNamespace = io.of("game");
app.set("io", io);
app.set("game", gameNamespace);

gameNamespace.on('connection', (socket) => {
    //console.log(socket);
    console.log("asd");
})

server.listen(port);