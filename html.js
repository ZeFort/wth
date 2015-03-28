var fs = require('fs')
module.exports = {
	send: function(req, res, filename, locals) {
		fs.readFile(filename, 'utf8', function(err, data) {
			if (err) {
				return res.send('He-he, error', err);
			}
			for (var key in locals) {
				data = data.replace('{{' + key + '}}', locals[key]);
			}
			return res.send(data);
		});
	}
}