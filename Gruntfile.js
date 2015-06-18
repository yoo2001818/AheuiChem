module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    copy: [
      {
        expand: true,
        cwd: 'src/html',
        src: ['**/*'],
        dest: 'build/'
      }
    ],
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        sourceMap: true,
        mangle: {
          sort: true,
          toplevel: true,
          eval: true
        }  
      },
      files: {
        src: 'build/<%= pkg.name %>.js',
        dest: 'build/<%= pkg.name %>.min.js'
      }
    },
    browserify: {
      files: {
        src: 'src/init.js',
        dest: 'build/<%= pkg.name %>.js'
      }
    }
  });
  
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('default', ['copy', 'browserify', 'uglify']);
}