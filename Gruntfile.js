module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'public/build/<%= pkg.name %>-dashboard.js',
        dest: 'public/build/<%= pkg.name %>-dashboard.min.js'
      }
    },
    less: {
      dev: {
        options: {
          paths: ['public/css']
        },
        files: {
          "public/build/style-<%= pkg.name %>.css": "public/css/style.less"
        }
      },
      prod: {
        options: {
          paths: ["assets/css"],
          plugins: [
              new(require('less-plugin-autoprefix'))({
                browsers: ["last 2 versions"]
              }),
              new(require('less-plugin-clean-css'))({})
            ]
            // modifyVars: {
            //   imgPath: '"http://mycdn.com/path/to/images"',
            //   bgColor: 'red'
            // }
        },
        files: {
          "public/build/style-<%= pkg.name %>.min.css": "public/css/style.less"
        }
      }
    },
    concat: {
      options: {
        //separator: ';',
      },
      multi: {
        files: {
          'public/build/<%= pkg.name %>-dashboard.js': [
            'public/js/util/*.js',
            'public/js/map/*.js',
            'public/js/shared/*.js',
            'public/js/shared/**/*.js',
            'public/js/dashboard/model/*.js',
            'public/js/dashboard/collection/*.js',
            'public/js/dashboard/router/*.js',
            'public/js/dashboard/view/*.js',
            'public/js/dashboard/*.js'
          ],
          'public/build/<%= pkg.name %>-login.js':[
            'public/js/login/*.js'
          ],
          'public/build/<%= pkg.name %>-signup.js':[
            'public/js/signup/*.js'
          ],
          'public/build/forms/<%= pkg.name %>-addEvent.js':[
            'public/js/forms/addEvent.js'
          ],
          'public/build/forms/<%= pkg.name %>-manageEvent.js':[
            'public/js/forms/manageEvent.js'
          ],
          'public/build/<%= pkg.name %>-map.js':[
            'public/js/util/*.js',
            'public/js/helpers/*.js',
            'public/js/map/*.js',
            'public/js/eventMap/*.js',
            'public/js/eventMap/models/*.js',
            'public/js/eventMap/collections/*.js',
            'public/js/eventMap/router/*.js',
            'public/js/eventMap/views/*.js',
            'public/js/shared/*.js',
            'public/js/shared/**/*.js'
          ],
          'public/build/<%= pkg.name  %>-calendar.js':[
            'public/js/calendar/index.js'
          ]
        }
      }
    },
    watch: {
      js: {
        files: [
          'public/js/*.js',
          'public/js/**/*.js',
          'public/js/**/**/*.js'
        ],
        tasks: ['concat']
      },
      //browserify: {
      //  files: ['public/js/*.js'],
      //  tasks: ['bump', 'browserify:dev']
      //},
      css: {
        files: 'public/css/*.less',
        tasks: ['less']
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  // Default task(s).
  grunt.registerTask('default', ['concat', 'uglify', 'less', 'watch']);
  grunt.registerTask('production', ['concat', 'uglify', 'less:prod']);

};
