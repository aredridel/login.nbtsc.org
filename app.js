var http = require('http');
var fs = require('fs');
var hyperstream = require('hyperstream');
var ecstatic = require('ecstatic')(__dirname + '/public');

var persona = require('persona-id')({audience: 'https://login.nbtsc.org'});

var sessions = {};
persona.on('create', function (sid, id) {
    sessions[sid] = id.email;
});

persona.on('destroy', function (sid) {
    delete sessions[sid];
});

var server = http.createServer(function (req, res) {
    if (persona.test(req)) {
        req.on('data', function () {}); // Passenger. Duh.
        persona.handle(req, res);
    } else if (req.url === '/') {
        var sid = persona.getId(req);
        res.writeHead(200, { "Content-Type": "text/html" });
        fs.createReadStream(__dirname + '/public/index.html')
            .pipe(hyperstream({ '#whoami': sessions[sid] || '' }))
            .pipe(res)
        ;
    } else ecstatic(req, res)
});

server.listen(5000);
