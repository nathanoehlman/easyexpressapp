var should = require('chai').should(),
    path = require('path'),
    request = require('request'),
    easyapp = require('..');
    
describe('EasyExpressApp', function(){

    var app;

    before(function(done) {
        app = easyapp.Server({ 
            id: 'testapp',
            workingDirectory: __dirname,
            server: {
                port: 9878
            }   
        });
        app.start(done);
    });
    
    it('should be able to get the loaded route', function(done) {

        request({
            method: 'GET',
            url: 'http://localhost:9878/',
            json: true
        }, function(err, response, data) {
            if (err) return done(err);

            data.message.should.equal('Server up');
            return done();
        });

    });
    
});