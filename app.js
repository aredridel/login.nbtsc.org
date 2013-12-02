var http = require('http');
var fs = require('fs');
var hyperstream = require('hyperstream');
var ecstatic = require('ecstatic')(__dirname + '/static');

var persona = require('persona-id')({audience: 'https://login.nbtsc.org'});

var level = require('level');
var sessions = level('sessions.db');

persona.on('create', function (sid, id) {
    console.warn("create", sid, id);
    sessions.put(sid, JSON.stringify(id));
});

persona.on('destroy', function (sid) {
    console.warn("destroy", sid);
    sessions.del(sid);
});

var server = http.createServer(function (req, res) {
    if (persona.test(req)) {
        req.on('data', function () {}); // Passenger. Duh.
        persona.handle(req, res);
    } else if (req.url == '' || req.url == '/') {
        var sid = persona.getId(req);
        if (sid) {
            sessions.get(sid, serve);
        } else {
            serve();
        }
    } else ecstatic(req, res)

    function serve(err, session) {
        if (err) throw err;
        if (session) session = JSON.parse(session);
        res.writeHead(200, { "Content-Type": "text/html" });
        fs.createReadStream(__dirname + '/static/index.html')
            .pipe(hyperstream({ '#whoami': session ? session.email : '' }))
            .pipe(res)
        ;
    }
});

server.listen(5000);
