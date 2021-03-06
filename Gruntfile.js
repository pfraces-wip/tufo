var matchdep = require('matchdep');

module.exports = function (grunt) {
  'use strict';

  matchdep.filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    prj: {
      src: 'src',
      build: 'build',
      test: 'test',
      fixtures: 'fixtures',
      vendor: 'dependencies',

      css: {
        src: '<%= prj.src %>',
        build: '<%= prj.build %>/css'
      },

      js: {
        src: '<%= prj.src %>',
        build: '<%= prj.build %>/<%= prj.src %>'
      },

      assets: {
        src: '<%= prj.src %>/assets',
        build: '<%= prj.build %>/assets'
      },

      deps: {
        css: ['<%= prj.src %>/lib/ui'],
        js: [
          '<%= prj.vendor %>/define/src/define.js',
          '<%= prj.vendor %>/mu.is/src/is.js',
          '<%= prj.vendor %>/mu.fn/src/fn.js',
          '<%= prj.vendor %>/mu.object/src/object.js',
          '<%= prj.vendor %>/mu.list/src/list.js',
          '<%= prj.vendor %>/mu.tree/src/tree.js',
          '<%= prj.vendor %>/mu.api/src/api.js',
          '<%= prj.vendor %>/domo/src/domo.js',
          '<%= prj.vendor %>/domo.repeater/src/repeater.js',
          '<%= prj.vendor %>/domo.on.extras/src/on.extras.js',
          '<%= prj.vendor %>/mu.async/src/events.js',
          '<%= prj.vendor %>/model/src/model.js',
          '<%= prj.vendor %>/firebase-bower/firebase.js'
        ]
      }
    },

    clean: {
      build: ['<%= prj.build %>']
    },

    includes: {
      build: {
        expand: true,
        cwd: '<%= prj.build %>',
        src: [ 'index.html' ],
        dest: '<%= prj.build %>',
        options: {
          includePath: '<%= prj.src %>'
        }
      }
    },

    less: {
      styles: {
        options: {
          sourceMap: true,
          outputSourceFiles: true,
          sourceMapFilename: '<%= prj.css.build %>/app.css.map',
          sourceMapURL: 'app.css.map',
          paths: '<%= prj.deps.css %>'
        },
        src: ['<%= prj.css.src %>/app.less'],
        dest: '<%= prj.css.build %>/app.css'
      }
    },

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      scripts: {
        src: ['<%= prj.js.src %>/**/*.js']
      },
      tests: {
        src: ['<%= prj.test %>/**/*.js']
      }
    },

    index: {
      build: {
        dir: '<%= prj.build %>',
        src: [
          '<%= less.styles.dest %>',
          '<%= prj.deps.js %>',
          '<%= jshint.scripts.src %>'
        ]
      }
    },

    copy: {
      scripts: {
        src: ['<%= prj.js.src %>/**/*.js'],
        dest: '<%= prj.build %>/'
      },
      deps: {
        src: ['<%= prj.deps.js %>'],
        dest: '<%= prj.build %>/'
      },
      assets: {
        expand: true,
        cwd: '<%= prj.assets.src %>/',
        src: ['**'],
        dest: '<%= prj.assets.build %>/'
      }
    },

    freddie: {
      build: {
        options: {
          root: '<%= prj.build %>',
          port: 3000,
          fixtures: {
            '/api': '<%= prj.fixtures %>'
          }
        }
      }
    },

    notify: {
      partials: {
        options: {
          message: 'partials are ready'
        }
      },
      less: {
        options: {
          message: 'styles are ready'
        }
      },
      assets: {
        options: {
          message: 'assets are ready'
        }
      },
      scripts: {
        options: {
          message: 'scripts are ready'
        }
      },
      tests: {
        options: {
          message: 'tests are ready'
        }
      },
    },

    watch: {
      partials: {
        files: ['<%= prj.src %>/**/*.html'],
        tasks: ['index:build', 'includes', 'notify:partials']
      },
      less: {
        files: ['<%= prj.css.src %>/**/*.less'],
        tasks: ['less', 'notify:less']
      },
      assets: {
        files: ['<%= prj.assets.src %>/**'],
        tasks: ['copy:assets', 'notify:assets']
      },
      scripts: {
        files: ['<%= jshint.scripts.src %>'],
        tasks: [
          'jshint:scripts',
          /* TODO: add tests, */
          'copy:scripts',
          'notify:scripts'
        ]
      },
      tests: {
        files: ['<%= jshint.tests.src %>'],
        tasks: ['jshint:tests' /* , TODO: add tests */, 'notify:tests']
      }
    }
  });

  grunt.registerTask('compile', [
    'less',
    'copy:scripts',
    'copy:deps',
    'copy:assets'
  ]);

  grunt.registerTask('build', [
    'clean',
    'jshint',
    /* TODO: add tests */
    'compile',
    'index:build',
    'includes'
  ]);

  grunt.registerTask('dev', [
    'build',
    'freddie',
    'watch'
  ]);

  grunt.registerTask('default', ['dev']);

  (function () {
    var ext = function (ext) {
      var extRE = new RegExp('\.' + ext + '$');
      return RegExp.prototype.test.bind(extRE);
    };

    var task = function () {
      var dir = this.data.dir,
          files = this.filesSrc;

      var relativePath = function (file) {
        return file.replace(dir + '/', '');
      };

      var scripts = files.filter(ext('js')).map(relativePath),
          styles = files.filter(ext('css')).map(relativePath),
          dev = grunt.task.current.target === 'build';

      var src = 'build_templates/index.tpl.html',
          dest = dir + '/index.html';

      grunt.file.copy(src, dest, {
        process: function (contents) {
          return grunt.template.process(contents, {
            data: {
              scripts: scripts,
              styles: styles,
              dev: dev
            }
          });
        }
      });
    };

    grunt.registerMultiTask('index', 'Process index template', task);
  })();
};
