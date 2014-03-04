var _ = require('lodash'),
	async = require('async'),
	events = require('events'),
	express = require('express'),
	fs = require('fs'),
	hbs = require('hbs'),
	http = require('http'),
	path = require('path'),
	passport = require('passport'),
	util = require('util');

function Server(opts) {
	events.EventEmitter.call(this);

	this.opts = opts || {};
	this.config = {};
	this._working = opts.workingDirectory || process.cwd();
    this.passport = passport;
    this.hbs = hbs;

}
util.inherits(Server, events.EventEmitter);

Server.prototype.require = function(file) {
	return require(file);
}

/**
  Starts the server
 **/
Server.prototype.start = function(callback) {

    var appl = this;

    async.series(
        _.map(['_createServer', '_loadRoutes', '_startServer'], function(func) {
            return appl[func].bind(appl);
        }), callback);
}

/**
  Create the express server (by default)
  Override this method to create a different kind of server
 **/
Server.prototype._createServer = function(callback) {

    var appl = this, 
        server = express(),
        config = appl.opts.server || {};

    appl.emit('initialize', server);

    server.configure(appl.opts.configure || function(){
        server.set('port', config.port || 3000);
        server.set('views', path.join(appl._working, 'resources', 'views'));
        server.set('view engine', 'html');
        server.engine('html', hbs.__express);
        server.use(express.favicon());
        server.use(express.logger('dev'));
        server.use(express.bodyParser());
        server.use(express.cookieParser());         

        if (appl.opts.sessions) {
        	server.use(express.session({ secret: appl.opts.sessionSecret }));
        	server.use(passport.initialize());
	        server.use(passport.session());
        }        
        server.use(express.methodOverride());
        appl.emit('configured', server);
        server.use(server.router);
        server.use(express.static(path.join(appl._working, 'public')));        
    });

    server.configure('development', function(){
        server.use(express.errorHandler());
    });

    require('./renderer')(appl);    
    appl.server = server;
    callback();
}

/**
  Load the routes
 **/
Server.prototype._loadRoutes = function(callback) {

    var appl = this;

    /**
     * Load all of the API routes located in the /routes directory
     **/
    fs.readdir(path.join(appl._working, 'lib', 'routes'), function(err, files) {
        if (!err) {
            files.forEach(function(file) {
                if (file.match(/\.js$/i))
                    require(path.join(appl._working, 'lib', 'routes', file))(appl);
            });
            callback();
        } else {
            callback('Unable to load any routes');
        }
    });
}

/**
  Start the server
 **/
Server.prototype._startServer = function(callback) {

    var appl = this,
        server = appl.server;

    http.createServer(server).listen(server.get('port'), function(){
        console.log("Server listening on port " + server.get('port'));
        callback();
    });

}

module.exports = function(opts) {
	return new Server(opts);
}