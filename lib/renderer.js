var _ = require('lodash'),
    fs = require('fs'),
    hbs = require('hbs'),
	handlebars = hbs.handlebars,
    helpers = require('handlebars-helpers'),
    inclusive = require('inclusive'),
    moment = require('moment'),
    path = require('path');

module.exports = function(appl) {

    var viewsDir = path.join(appl._working, 'resources', 'views');

    helpers.register(hbs, {}, {});

	hbs.registerHelper('baseUrl', function(total, count) {
        return appl.opts.server.url;
    });

    hbs.registerHelper('average', function(total, count) {
        return Math.round(total / count * 100) / 100;
    });

    hbs.registerHelper('toNumber', function(number) {
        return number || 0;
    });

    hbs.registerHelper('centsToMoney', function(cents) {
        if (!cents) return '0.00';
        return (cents / 100).toFixed(2)
    });    

    hbs.registerHelper("math", function(lvalue, operator, rvalue, options) {
        if (arguments.length < 4) {
            // Operator omitted, assuming "+"
            options = rvalue;
            rvalue = operator;
            operator = "+";
        }
            
        lvalue = parseFloat(lvalue);
        rvalue = parseFloat(rvalue);
            
        return {
            "+": lvalue + rvalue,
            "-": lvalue - rvalue,
            "*": lvalue * rvalue,
            "/": lvalue / rvalue,
            "%": lvalue % rvalue
        }[operator];
    });

    hbs.registerHelper("key_value", function(obj, opts) {

        var buffer = "",
            key;
     
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                buffer += opts.fn({key: key, value: obj[key]});
            }
        }
     
        return buffer;
    });

    hbs.registerHelper('modulo', function(n, options) {
        var m = parseInt(options.hash.m);
        if((n % m) == 0) {
            return options.fn(this);
        }
        else {
            return options.inverse(this);
        }
    });

    hbs.registerHelper('formatDate', function(date, opts) {
        if (!date) return '';        
        var toFormat = moment(date),
            format;

        if (typeof opts == 'string') {
            format = opts;
        } else if (opts.hash && opts.hash.format) {
            format = opts.hash.format;
        }
        return toFormat.format(format || 'DD-MM-YYYY hh:mm A');
    });

    hbs.registerHelper('if_eq', function(context, options) {
        if (context == options.hash.compare)
            return options.fn(this);
        return options.inverse(this);
    });

    hbs.registerHelper('render', function(template, data) {
        var tpl = handlebars.compile((template.content ? template.content : template || ''));
        return tpl(data);
    });    

    hbs.registerHelper('json_stringify', function(data) {
        if (data) {
            try {
                return JSON.stringify(data);    
            } catch (err) {
                return data.toString();
            }
            
        }
        return '';
    });

    var partialsDir = viewsDir + '/partials';
    if (fs.existsSync(partialsDir)) {
        hbs.registerPartials(partialsDir, function(err) {
            if (err) return console.log(err);
        });
        inclusive(partialsDir, {
            handler: function(filePath) { return fs.readFileSync(filePath, 'utf-8'); }
        }, function(err, includes) {

            var partials = {};
            _.each(includes, function(value, key) {
                partials[path.basename(key, '.html')] = handlebars.compile(value);
            });

            hbs.registerHelper('renderPartial', function(partialName, data) {
                var tpl = partials[partialName];
                return (tpl ? tpl(data) : '');
            });

            hbs.registerHelper('enable', function(partialName, data) {
                var tpl = partials['enable_' + partialName];
                return (tpl ? tpl(data) : '');
            });

            hbs.registerHelper('input', function(partialName, data) {
                var tpl = partials['input_' + partialName];
                return (tpl ? tpl((data && data.hash ? data.hash : data)) : '');
            });

        }); 
    }

    hbs.registerHelper('js_string', function(val, data) {
        return val.replace(/(\r\n|\n|\r)/gm, ' ').trim();
    });
	
	return hbs;
};