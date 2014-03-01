module.exports = function(app) {
	
	app.server.get('/', function(req, res, next) {
		return res.json(200, { message: 'Server up' });
	});
	
}