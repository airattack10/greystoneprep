'use strict';

module.exports = function(grunt) {

  // Show elapsed time after tasks run to visualize performance
  require('time-grunt')(grunt);
  // Load all Grunt tasks that are listed in package.json automagically
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    // shell commands for use in Grunt tasks
    shell: {
      jekyllBuild: {
        command: 'bundle exec jekyll build'
      },
      jekyllServe: {
        command: 'bundle exec jekyll serve --config _config.yml,_config_dev.yml'
      },
      jekyllServeTrimmed: {
        command: 'bundle exec jekyll serve --config _config.yml,_config_dev.yml,_config_dev_trimmed.yml'
      },
      jekyllProfile: {
        command: 'bundle exec jekyll serve --config _config.yml,_config_dev.yml --profile'
      },
      jekyllIncremental: {
        command: 'bundle exec jekyll serve --config _config.yml,_config_dev.yml --incremental'
      }
    },

    // watch for files to change and run tasks when they do
    watch: {
      sass: {
        files: ['_sass/**/*.{scss,sass}'],
        tasks: ['sass'],
        options: {
          livereload: true
        }
      },
      jsx: {
        files: ['assets/jsx/*.jsx'],
        tasks: ['babel'],
        options: {
          livereload: false
        }
      },
      js: {
        files: ['assets/javascripts/*.js'],
        options: {
          livereload: true
        }
      }
    },

    // sass (libsass) config
    sass: {
      options: {
        sourceMap: true,
        relativeAssets: false,
        outputStyle: 'expanded',
        sassDir: '_sass',
        cssDir: 'public/assets/css'
      },
      build: {
        files: [
          {
            expand: true,
            cwd: '_sass/',
            src: ['**/*.{scss,sass}'],
            dest: 'assets/css',
            ext: '.css'
          }
        ]
      }
    },

    // React trasformer for JSX
    babel: {
      options: {
        sourceMap: false,
        presets: ['es2015', 'react']
      },
      jsx: {
        files: [
          {
            expand: true,
            cwd: 'assets/jsx/', // Custom folder
            src: [
              '*.js', '*.jsx'
            ],
            dest: 'assets/javascripts/', // Custom folder
            ext: '.js'
          }
        ]
      }
    },

    convert: {
      options: {
        explicitArray: false,
      },
      csv2json: {
        src: ['conversions/csv-to-json/*.csv'],
        dest: 'conversions/converted-to-json/test.json'
      },
      json2yml: {
        files: [
          {
            expand: true,
            cwd: 'conversions/json-to-yml/',
            src: ['**/*.json'],
            dest: 'conversions/converted-to-yml/',
            ext: '.yml'
          }
        ]
      }
    },

    // run tasks in parallel
    concurrent: {
      serve: [
        'sass', 'babel', 'watch', 'shell:jekyllServe'
      ],
      serve_trimmed: [
        'sass', 'babel', 'watch', 'shell:jekyllServeTrimmed'
      ],
      incremental: [
        'sass', 'babel', 'watch', 'shell:jekyllIncremental'
      ],
      profile: [
        'sass', 'babel', 'watch', 'shell:jekyllProfile'
      ],
      options: {
        logConcurrentOutput: true
      }
    }
  });

  // For converting files
  grunt.loadNpmTasks('grunt-convert');
  // Register the grunt serve task
  grunt.registerTask('dev', ['concurrent:serve']);

  grunt.registerTask('dev-trimmed', ['concurrent:serve_trimmed']);

  grunt.registerTask('incremental', ['concurrent:incremental']);

  grunt.registerTask('profile', ['concurrent:profile']);

  // Register the grunt build task
  grunt.registerTask('build', ['shell:jekyllBuild', 'sass']);

  // Register build as the default task fallback
  grunt.registerTask('default', ['babel', 'build']);

  grunt.registerTask('json-to-yml', ['convert:json2yml']);

  grunt.registerTask('csv-to-json', ['convert:csv2json']);

  // This is a super janky process for converting trainings Excel spreadsheet to markdown files
  // 1. Make sure the spreadsheet meets the following requirements
  //    - Columns =

  function buildYamlArray(myArray){
    var newString = "";
    for(var i = 0; i < myArray.length; i++) {
      var obj = myArray[i];
      if (obj != false && obj != "" && obj != "false" && obj != null && obj != undefined ) {
        newString = newString + ' \n- "' + obj.toString().trim() + '"';
      }
    }
    return(newString)
  };

  grunt.registerTask('json-to-training-md', 'Convert JSON to md files', function() {

    var myJSON = grunt.file.readJSON('conversions/converted-to-json/test.json');
    for(var i = 0; i < myJSON.length; i++) {
      var obj = myJSON[i];
      var rootFilePath = "conversions/converted-to-md/"
      var formattedTitle = obj.title.split(" ").join("-").toLowerCase().replace(/[^\w\s-]/gi, '');
      var formattedCategory = obj.product.split(" ").join("-").toLowerCase().replace(/[^\w\s-]/gi, '');
      var fileName = rootFilePath.concat(obj.date, "-", formattedTitle, ".md")

      var frontMatter = "---";
      var content = frontMatter.concat(
        '\n',
        'layout: training',
        '\n',
        'sitemap: false',
        '\n',
        'categories: ', '[', formattedCategory, ']',
        '\n',
        'title: ', '"', obj.title.trim(), '"',
        '\n',
        'date: ', obj.date.trim(),
        '\n',
        'time: ', '"', obj.time, '"',
        '\n',
        'timezone: EST',
        '\n',
        'presenters: [', obj.presenters.trim(), ']',
        '\n',
        'form_handler: ', obj.form_handler.trim(),
        '\n',
        "---"
      );
      grunt.file.write(fileName, content);
      grunt.log.writeln("Created: " + fileName);
    }
  });

  grunt.registerTask('json-to-training-template-md', 'Convert JSON to md files', function() {
    var myJSON = grunt.file.readJSON('conversions/converted-to-json/test.json');
    //grunt.log.writeln(myJSON);
    for(var i = 0; i < myJSON.length; i++) {
      // Get the correct record
      var obj = myJSON[i];
      var rootFilePath = "conversions/converted-to-md/"

      var formattedTitle = obj.title.split(" ").join("-").toLowerCase().replace(/[^\w\s-]/gi, '').replace("--", "-").trim();
      var formattedCategory = obj.product.split(" ").join("-").toLowerCase().replace(/[^\w\s-]/gi, '').trim();
      var fileName = rootFilePath.concat(formattedTitle, ".md");

      var outcomesArray = [
        obj.learning_outcome_1,
        obj.learning_outcome_2,
        obj.learning_outcome_3,
        obj.learning_outcome_4,
        obj.learning_outcome_5,
        obj.learning_outcome_6,
        obj.learning_outcome_7,
        obj.learning_outcome_8
      ];

      var permlink = '/training/' + formattedCategory + '/' + formattedTitle + '/'

      var frontMatter = "---";
      var content = frontMatter.concat(
        '\n',
        'layout: training-by-title',
        '\n',
        'sitemap: false',
        '\n',
        'exclude_from_nav: ', obj.exclude_from_nav.trim(),
        '\n',
        'title: "', obj.title.trim(), '"',
        '\n',
        'audience: "', obj.audience.trim(), '"',
        '\n',
        'learning_outcomes:', buildYamlArray(outcomesArray),
        '\n',
        'special_page_class: ', 'upcoming-trainings',
        '\n',
        'categories: [', formattedCategory, ']',
        '\n',
        'timezone: ', obj.timezone.trim(),
        '\n',
        'presenters: [', obj.presenters.trim(), ']',
        '\n',
        'description: "', obj.description.trim(), '"',
        '\n',
        'submit_text: "', obj.submit_text.trim(), '"',
        '\n',
        'advertising: "', obj.advertising, '"',
        '\n',
        'permalink: ', permlink,
        '\n',
        "---"
      );
      // Write to file
      grunt.file.write(fileName, content);

      // Display what was generated in the log
      grunt.log.writeln(content);
    }
  });

  grunt.registerTask('generate-training', ['csv-to-json', "json-to-training-md"]);
  grunt.registerTask('generate-training-templates', ['csv-to-json', "json-to-training-template-md"]);

};
