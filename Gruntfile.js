var fs = require("fs");
var grunt = require("grunt");

try {
	var moment = require("moment");
} catch (e) {
	grunt.log.error('Please run "npm install"');
	return;
}
module.exports = function(grunt) {
	// read deploy configs only if current task is "deploy"
	var deploy_data = grunt.file.readJSON("secret.json");
	var deploy_env = grunt.option("config") || "development";
	var deploy_paths = deploy_data.paths[deploy_env];
	var deploy_config = deploy_data.config[deploy_env];
	var deploy_name = deploy_data.name;
	var deploy_releases_dir = deploy_paths.release_dir;
	var deploy_dirname = moment().format("YYYY-MM-DD_HH_mm_ss") + "_" + deploy_env;
	var deploy_new_release_dir = deploy_paths.release_dir + deploy_dirname;
	if (deploy_config.privateKey) deploy_config.privateKey = grunt.file.read(deploy_config.privateKey);

	grunt.initConfig({
		deploy: {
			env: deploy_env,
			name: deploy_name,
			data: deploy_data,
			paths: deploy_paths,
			dirname: deploy_dirname,
			releases_dir: deploy_releases_dir,
			new_release_dir: deploy_new_release_dir
		},

		nodemon: {
			server: {
				script: "app.js",
				options: {
					//nodeArgs: ["--debug"],
					ignore: [
						"README.md",
						"node_modules/**",
						".git/**",
						"public/**"
					],
					debug: true
				}
			}
		},

		sshconfig: {
			development: deploy_config,
			staging: deploy_config,
			production: deploy_config,
			username: deploy_config.username,
			password: deploy_config.password,
			showProgress: true,
			host: deploy_config.host
		},

		compress: {
			zip: {
				options: {
					archive: "<%= deploy.dirname %>.zip",
					mode: "zip"
				},
				files: [{
					src: [
						".bowerrc",
						"bower.json",
						"package.json",
						"public/**",
						"app.js"
					],
					expand: true,
					dest: '/'
				}]
			}
		},

		sftp: {
			"import-files": {
				files: {
					"./": ["<%= deploy.dirname %>.zip"]
				},
				options: {
					createDirectories: true,
					path: deploy_new_release_dir,
					username: deploy_config.username,
					password: deploy_config.password,
					showProgress: true,
					host: deploy_config.host
				}
			}
		},

		sshexec: {
			"server-stop": {
				command: "pm2 delete app_<%= deploy.name %>_<%= deploy.env %>",
				options: {
					ignoreErrors: true,
					username: deploy_config.username,
					password: deploy_config.password,
					showProgress: true,
					host: deploy_config.host
				}
			},

			"unzip-and-delete": {
				command: "cd <%= deploy.new_release_dir %> && " +
					"unzip <%= deploy.dirname %>.zip && " +
					"rm <%= deploy.dirname %>.zip",
				options: {
					username: deploy_config.username,
					password: deploy_config.password,
					showProgress: true,
					host: deploy_config.host
				}
			},

			"install-modules": {
				command: "cd <%= deploy.new_release_dir %> && " +
					"npm install --production && bower install --allow-root",
				options: {
					username: deploy_config.username,
					password: deploy_config.password,
					showProgress: true,
					host: deploy_config.host
				}
			},

			"update-symlinks-unlink": {
				command: "unlink <%= deploy.paths.link %>",
				options: {
					ignoreErrors: true,
					username: deploy_config.username,
					password: deploy_config.password,
					showProgress: true,
					host: deploy_config.host
				}
			},

			"update-symlinks-make": {
				command: "ln -s <%= deploy.new_release_dir %> <%= deploy.paths.link %>",
				options: {
					username: deploy_config.username,
					password: deploy_config.password,
					showProgress: true,
					host: deploy_config.host
				}
			},

			"server-start": {
				command: "cd <%= deploy.paths.link %> && " +
					"pm2 start app.js --name app_<%= deploy.name %>_<%= deploy.env %> -- --env=<%= deploy.env %> ",
				options: {
					username: deploy_config.username,
					password: deploy_config.password,
					showProgress: true,
					host: deploy_config.host
				}
			},

			"remove-old-releases-except-3-last": {
				command: "cd <%= deploy.releases_dir %> && " +
					"rm -r `ls -t | tail -n+4`",
				options: {
					username: deploy_config.username,
					password: deploy_config.password,
					showProgress: true,
					host: deploy_config.host
				}
			},
		},
		"run": {
			"run": {}
		}
	});
	grunt.loadNpmTasks("grunt-nodemon");
	grunt.loadNpmTasks("grunt-ssh");
	grunt.loadNpmTasks('grunt-contrib-compress');

	grunt.registerTask("delete-zip", function() {
		var filename = "${dirname}.zip".replace("${dirname}", deploy_dirname);
		require("fs").unlink(filename, function() {
			grunt.log.writeln("Deleted: %s", filename);
		});
	});

	var deploy_tasks = [
		"compress:zip",
		"sftp:import-files",
		"delete-zip",
		"sshexec:unzip-and-delete",
		"sshexec:server-stop",
		"sshexec:install-modules",
		"sshexec:update-symlinks-unlink",
		"sshexec:update-symlinks-make",
		"sshexec:server-start",
		"sshexec:remove-old-releases-except-3-last"
	];

	grunt.registerTask("deploy", deploy_tasks);

	grunt.registerMultiTask("run", function() {
		grunt.task.run("nodemon");
	});
};