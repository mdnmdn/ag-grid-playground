(function (global) {
  // simplified version of Object.assign for es3
  function assign() {
    var result = {};
    for (var i = 0, len = arguments.length; i < len; i++) {
      var arg = arguments[i];
      for (var prop in arg) {
        result[prop] = arg[prop];
      }
    }
    return result;
  }

  System.config({
    transpiler: 'plugin-babel',
    defaultExtension: 'js',
    paths: {
      'npm:': 'https://unpkg.com/',
    },
    map: {
      // babel transpiler
      'plugin-babel': 'npm:systemjs-plugin-babel@0.0.25/plugin-babel.js',
      'systemjs-babel-build': 'npm:systemjs-plugin-babel@0.0.25/systemjs-babel-browser.js',
      //'plugin-babel': './libs/plugin-babel.js',
      //'systemjs-babel-build': './libs/systemjs-babel-browser.js',

      // react
      react: 'npm:react@16.9.0',
      'react-dom': 'npm:react-dom@16.9.0',
      'react-dom-factories': 'npm:react-dom-factories',
      'prop-types': 'npm:prop-types',

      app: 'src/app.js',
      api: 'src/api.js',
      
      'ag-grid-community': 'https://unpkg.com/ag-grid-community@21.1.0/dist/ag-grid-community.js',
      'ag-grid-community/main': 'https://unpkg.com/ag-grid-community@21.1.0/dist/ag-grid-community.js',
      'ag-grid-enterprise': 'https://unpkg.com/ag-grid-enterprise@21.1.0/',
      'ag-grid-react': 'npm:ag-grid-react@21.1.0/',
    }
    ,

    packages: {
      react: {
        main: './umd/react.development.js'
      },
      'react-dom': {
        main: './umd/react-dom.development.js'
      },
      'prop-types': {
        main: './prop-types.min.js',
        defaultExtension: 'js'
      },
      app: {
        defaultExtension: 'jsx'
      },
      'ag-grid-react': {
        main: './main.js',
        defaultExtension: 'js'
      },
      'ag-grid-enterprise': {
        main: './main.js',
        defaultExtension: 'js'
      }
    },
    meta: {
      '*.js': {
        babelOptions: {
          react: true
        }
      }
    }
  });

  System.import('app').catch(function (err) { console.error(err); })
})(this);