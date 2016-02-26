// Ionic Healthcafe App
(function() {
  // Additional application modules to be initialized and loaded in the main application
	var appModules = [
	    'healthcafe.generic',
	    'healthcafe.intro',
	    'healthcafe.login',
	    'healthcafe.bloodpressure',
	    'healthcafe.bodyweight',
	    'healthcafe.bmi',
	    'healthcafe.bloodglucose',
	    'healthcafe.cholesterol',
	    'healthcafe.timeline',
	    'healthcafe.remarks',
	    'healthcafe.sharing',
    ];

	angular.module('healthcafe', ['ionic', 'ngMessages', 'angularUUID2', 'angular-timeline', 'indexedDB' ].concat(appModules) )
		.run([ '$ionicPlatform', function($ionicPlatform) {
		  $ionicPlatform.ready(function() {
		    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
		    // for form inputs)
		    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
		      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
		      cordova.plugins.Keyboard.disableScroll(true);

		    }
		    if (window.StatusBar) {
		      // org.apache.cordova.statusbar required
		      StatusBar.styleDefault();
		    }
		  });
		}]);

	for( idx in appModules ) {
		angular.module( appModules[idx], []);
	}
})();

(function() {
	// Configuration for the trombose app.
	// The configuration is a regular map, which can be acccessed throughout the application
	var configuration = {
    // The ENV points to the set of settings being used.
    // See for example the api subconfiguration
    "env": "test",

    // Generic configuration

    //
    // Sharing configuration determines the services the user can share data with
    //
    sharing: {
      healthcafe: {
        label: "NRC healthcafe",
        description: "Healthcafe is een concept, een werk-in-uitvoering, waar u binnnen de werkomgeving zelf bepaalde aspecten van uw gezondheid kan meten en daarop zelf kan acteren.",
        type: "openmhealth",
      }
    },

    //
    // Datatypes determine the menu items and the options for the user to share
    // Please note that the timeline and shareService have their own list of
    // datatypes, which should correspond to this list.
    // As the dependencies are injected there, we have to specify the dependencies
    // specifically there.
    datatypes: [
      { name: 'bloodpressure', controllerPrefix: 'BloodPressure', label: 'Blood pressure' },
      { name: 'bodyweight', controllerPrefix: 'BodyWeight', label: 'Body weight' },
      { name: 'bmi', controllerPrefix: 'BMI', label: 'Body Mass Index' },
      { name: 'bloodglucose', controllerPrefix: 'BloodGlucose', label: 'Blood Glucose' },
      { name: 'cholesterol', controllerPrefix: 'Cholesterol', label: 'Cholesterol' },
    ],

    // Development configuration
    "dev": {
      "api": {
        oauth: {
          healthcafe: {
            urls: {
              authorization: "http://localhost:8080/nrc/oauth/authorize",
              redirect: "http://localhost:8100/app/login/oauth_callback.html?healthcafe",
              dataPoints: "http://localhost:8080/nrc/api/openmhealth/v1/dataPoints"
            },

            // NRC OAuth application key
            key: "mbm85kztfalztd2fft5fl5w7hmmdar5nnlktkgkk",
          }
        }
      },
    },

    // Test configuration, used for testing the app with the healthcafe instance
    "test": {
      "api": {
        oauth: {
          healthcafe: {
            urls: {
              authorization: "https://humanstudies.tno.nl/healthcafe/oauth/authorize",
              redirect: "http://isdatsoftwareontwikkeling.nl/projecten/healthcafe/app/login/oauth_callback.html?healthcafe",
              dataPoints: "https://humanstudies.tno.nl/healthcafe/api/openmhealth/v1/dataPoints"
            },

            // NRC OAuth application key
            key: "hm2lkbxyssh9vvsn4tjpknavhqifmkzmucrl500o",
          }
        }
      },
    },

  };

	// Convenience method to use environments in configuration
	configuration.current = function() {
		return configuration[configuration.env];
	}

  // Store configuration in main module
	angular.module('healthcafe')

	  .constant('config', configuration )

    .config( ['$httpProvider', '$indexedDBProvider', function($httpProvider, $indexedDBProvider) {
      $httpProvider.interceptors.push('OAuth2Interceptor');

      // Initialize indexed DB
      $indexedDBProvider
        .connection( 'healthcafe' )
        .upgradeDatabase(1, function(event, db, tx) {
          datapointsStore = db.createObjectStore( "datapoints", { keyPath: "header.id" } );
          datapointsStore.createIndex('schema', [ 'header.schema_id.namespace', 'header.schema_id.name', 'header.schema_id.version'], { 'unique': false } );
          remarksStore = db.createObjectStore( "remarks", { keyPath: "id", autoIncrement: true } );
        })
    }])
})();

// Healthcafe routes
(function() {
	angular.module('healthcafe').config([ '$stateProvider', '$urlRouterProvider', 'config', function($stateProvider, $urlRouterProvider, config) {

	  // Ionic uses AngularUI Router which uses the concept of states
	  // Learn more here: https://github.com/angular-ui/ui-router
	  // Set up the various states which the app can be in.
	  // Each state's controller can be found in controllers.js
	  $stateProvider
      // Main App layout with left menu
      .state('app', {
        url: '/app',
        abstract: true,
        templateUrl: 'app/layout.html',
        controller: 'AppController as app'
      })

		  // Initial introduction page
		  .state('app.intro', {
		    url: '/intro',
        views: {
          'mainContent': {
            templateUrl: 'app/intro/intro.html',
            controller: 'IntroController as intro'
          }
        }
		  })

		  // Timeline
		  .state('app.timeline', {
		    url: '/timeline',
        cache: false,
        views: {
          'mainContent': {
            templateUrl: 'app/timeline/timeline.html',
            controller: 'TimelineController as timeline'
          }
        }
		  })

      for( i in config.datatypes ) {
        var datatype = config.datatypes[i];
        $stateProvider
          // Overview
          .state('app.' + datatype.name, {
            url: '/' + datatype.name,
            cache: false,
            views: {
              'mainContent': {
                templateUrl: 'app/' + datatype.name + '/chart.html',
                controller: datatype.controllerPrefix + 'Controller as ' + datatype.name
              }
            }
          })

          // Add new measurement
          .state('app.' + datatype.name + '_add', {
            url: '/' + datatype.name + '/add',
            views: {
              'mainContent': {
                templateUrl: 'app/' + datatype.name + '/create.html',
                controller: datatype.controllerPrefix + 'CreateController as ' + datatype.name
              }
            }
          })

          // Add information page about this datatype
          .state('app.' + datatype.name + '_info', {
            url: '/' + datatype.name + '/info',
            views: {
              'mainContent': {
                templateUrl: 'app/' + datatype.name + '/info.html',
                controller: 'GenericInfoController as info'
              }
            }
          })

          // Details about a single measurement
          .state('app.' + datatype.name + '_measurement', {
            url: '/' + datatype.name + '/detail/:measurementId',
            views: {
              'mainContent': {
                templateUrl: 'app/' + datatype.name + '/detail.html',
                controller: 'GenericDetailController as detail'
              }
            }
          });
      }

		  // Add remarks measurement. Remarks are only shown in the timeline for now.
		  $stateProvider.state('app.remarks_add', {
		    url: '/remarks/add',
        views: {
          'mainContent': {
            templateUrl: 'app/remarks/create.html',
    		    controller: 'RemarksCreateController as remarks'
          }
        }
		  });

      // Sharing
		  $stateProvider.state('app.share', {
		    url: '/share/:service',
        cache: false,
        views: {
          'mainContent': {
            templateUrl: 'app/share/share.html',
    		    controller: 'ShareController as sharing'
          }
        }
		  });

		  $stateProvider.state('app.connect', {
		    url: '/share/connect/:service',
        cache: false,
        views: {
          'mainContent': {
            templateUrl: 'app/share/connect.html',
    		    controller: 'ConnectController as connect'
          }
        }
		  });

	  // if none of the above states are matched, use this as the fallback
	  $urlRouterProvider.otherwise('/app/intro');

	}]);
})();

(function() {
	angular.module('healthcafe')
		.controller('AppController', AppController);

	AppController.$inject = [ 'config' ];

	function AppController(config) {
	  var vm = this;

    vm.datatypes = config.datatypes;
    vm.sharing = config.sharing;

    return vm;
	}
})();

(function() {
	angular.module('healthcafe.bloodglucose')
		.controller('BloodGlucoseController', BloodGlucoseController );

		BloodGlucoseController.$inject = [ '$scope', '$controller', 'BloodGlucose' ];

		function BloodGlucoseController( $scope, $controller, Model ) {
		  var vm = this;

      $scope.model = Model;
      $scope.selector = ".bloodglucose-container"
      $scope.chartableProperties = 'blood-glucose';
      $scope.chartOptions = {
              'measures': {
                'blood-glucose' : {
                  'valueKeyPath': 'body.blood_glucose.value',
                  'range': undefined,
                  'units': 'mg/dL',
                },
              }
            };

      // Initialize the super class and extend it.
      angular.extend(vm, $controller('GenericChartController', {$scope: $scope}));

		  return vm;
		}
})();

(function() {
	angular.module('healthcafe.bloodglucose')
		.factory('BloodGlucose', BloodGlucose );

  BloodGlucose.$inject = [ 'Datapoints' ];

  function BloodGlucose(Datapoints) {
    return Datapoints.getInstance(
      { namespace: 'omh', name: 'blood-glucose', version: '1.0' },
      function(data) {
        if( !data.level ) {
          return null;
        }

        return {
          'blood_glucose': { value: data.level, unit: 'mmHg' },
          'temporal_relationship_to_meal': data.relationship_to_meal ? data.relationship_to_meal.name : ""
        };
      }
    );
  }

})();

(function() {
	angular.module('healthcafe.bloodglucose')
		.controller('BloodGlucoseCreateController', BloodGlucoseCreateController );

		BloodGlucoseCreateController.$inject = [ '$scope', '$controller', 'BloodGlucose' ];

		function BloodGlucoseCreateController( $scope, $controller, Model ) {
		  var vm = this;

      $scope.model = Model;

      // Initialize the super class and extend it.
      angular.extend(vm, $controller('GenericCreateController', {$scope: $scope}));

      vm.relationships_to_meal = [
        { name: 'fasting' },
        { name: 'not fasting' }
      ];

		  return vm;
		}
})();

(function() {
	angular.module('healthcafe.bloodpressure')
		.controller('BloodPressureController', BloodPressureController );

		BloodPressureController.$inject = [ '$scope', '$controller', 'BloodPressure' ];

		function BloodPressureController( $scope, $controller, Model ) {
		  var vm = this;

      $scope.model = Model;
      $scope.selector = ".bloodpressure-container"
      $scope.chartableProperties = 'systolic_blood_pressure, diastolic_blood_pressure';
      $scope.chartOptions = {
        'userInterface': {
          'tooltips': {
            'contentFormatter': function(d) {
              var systolic = d.omhDatum.body.systolic_blood_pressure.value.toFixed( 0 );
              var diastolic = d.omhDatum.body.diastolic_blood_pressure.value.toFixed( 0 );
              return systolic + '/' + diastolic;
            }
          }
        }
      }

      // Initialize the super class and extend it.
      angular.extend(vm, $controller('GenericChartController', {$scope: $scope}));

		  return vm;
		}
})();

(function() {
	angular.module('healthcafe.bloodpressure')
		.factory('BloodPressure', BloodPressure );

  BloodPressure.$inject = [ 'Datapoints' ];

  function BloodPressure(Datapoints) {
    return Datapoints.getInstance(
      { namespace: 'omh', name: 'blood-pressure', version: '1.0' },
      function(data) {
        if( !data.systolic || !data.diastolic ) {
          return null;
        }

        return {
          'systolic_blood_pressure': { value: data.systolic, unit: 'mmHg' },
          'diastolic_blood_pressure': { value: data.diastolic, unit: 'mmHg' },
        };
      }
    );
  }

})();

(function() {
	angular.module('healthcafe.bloodpressure')
		.controller('BloodPressureCreateController', BloodPressureCreateController );

		BloodPressureCreateController.$inject = [ '$scope', '$controller', 'BloodPressure' ];

		function BloodPressureCreateController( $scope, $controller, Model ) {
		  var vm = this;

      $scope.model = Model;

      // Initialize the super class and extend it.
      angular.extend(vm, $controller('GenericCreateController', {$scope: $scope}));

		  return vm;
		}
})();

(function() {
	angular.module('healthcafe.bmi')
		.controller('BMIController', BMIController );

		BMIController.$inject = [ '$scope', '$controller', 'BMI' ];

		function BMIController( $scope, $controller, Model ) {
		  var vm = this;

      $scope.model = Model;
      $scope.selector = ".bmi-container"
      $scope.chartableProperties = 'body-mass-index';
      $scope.chartOptions = {
              'measures': {
                'body-mass-index' : {
                  'valueKeyPath': 'body.body_mass_index.value',
                  'range': undefined,
                  'units': 'kg/m2',
                  'thresholds': { 'min': 18, 'max': 25  },
                },
              }
            };

      // Initialize the super class and extend it.
      angular.extend(vm, $controller('GenericChartController', {$scope: $scope}));

		  return vm;
		}
})();

(function() {
	angular.module('healthcafe.bmi')
		.factory('BMI', BMI );

  BMI.$inject = [ 'Datapoints' ];

  function BMI(Datapoints) {
    return Datapoints.getInstance(
      { namespace: 'omh', name: 'body-mass-index', version: '1.0' },
      function(data) {
        if( !data.weight || !data.length ) {
          return null;
        }
        return {
          'body_mass_index': { value: data.weight / ( data.length * data.length ), unit: 'kg/m2' },
        };
      }
    );
  }

})();

(function() {
	angular.module('healthcafe.bmi')
		.controller('BMICreateController', BMICreateController );

		BMICreateController.$inject = [ '$scope', '$controller', 'BMI' ];

		function BMICreateController( $scope, $controller, Model ) {
		  var vm = this;

      $scope.model = Model;

      // Initialize the super class and extend it.
      angular.extend(vm, $controller('GenericCreateController', {$scope: $scope}));

		  return vm;
		}
})();

(function() {
	angular.module('healthcafe.bodyweight')
		.controller('BodyWeightController', BodyWeightController );

		BodyWeightController.$inject = [ '$scope', '$controller', 'BodyWeight' ];

		function BodyWeightController( $scope, $controller, Model ) {
		  var vm = this;

      $scope.model = Model;
      $scope.selector = '.bodyweight-container';
      $scope.chartableProperties = 'body_weight';
      $scope.chartOptions =   {
        'measures': {
          'body_weight': {
            'range': undefined,
            'thresholds': undefined,  // Disable default threshold
          },
        }
      };

      // Initialize the super class and extend it.
      angular.extend(vm, $controller('GenericChartController', {$scope: $scope}));

		  return vm;
		}
})();

(function() {
	angular.module('healthcafe.bodyweight')
		.factory('BodyWeight', BodyWeight );

  BodyWeight.$inject = [ 'Datapoints' ];

  function BodyWeight(Datapoints) {
    return Datapoints.getInstance(
      { namespace: 'omh', name: 'body-weight', version: '1.0' },
      function(data) {
        if( !data.weight ) {
          return null;
        }
        return { 'body_weight': { value: data.weight, unit: 'kg' } };
      }
    );
  }

})();


(function() {
	angular.module('healthcafe.bodyweight')
		.controller('BodyWeightCreateController', BodyWeightCreateController );

		BodyWeightCreateController.$inject = [ '$scope', '$controller', 'BodyWeight' ];

		function BodyWeightCreateController( $scope, $controller, Model ) {
		  var vm = this;

      $scope.model = Model;

      // Initialize the super class and extend it.
      angular.extend(vm, $controller('GenericCreateController', {$scope: $scope}));

		  return vm;
		}
})();

(function() {
	angular.module('healthcafe.cholesterol')
		.controller('CholesterolController', CholesterolController );

		CholesterolController.$inject = [ '$scope', '$controller', 'Cholesterol' ];

		function CholesterolController( $scope, $controller, Model ) {
		  var vm = this;

      $scope.model = Model;
      $scope.selector = ".cholesterol-container"
      $scope.chartableProperties = 'total-cholesterol,ldl-cholesterol,hdl-cholesterol,triglycerides';
      $scope.chartOptions = {
              'userInterface': {
                'legend': true,
                'thresholds': { 'show': false },
                'tooltips': {
                  'grouped': false,
                  'contentFormatter': function(d) {
                    return d.y.toFixed(1);
                  }
                }
              },
              'measures': {
                'total-cholesterol' : {
                  'valueKeyPath': 'body.blood_total_cholesterol.value',
                  'range':undefined,
                  'seriesName': 'Total Cholesterol',
                  'units': 'mg/dL',
                  'chart': {
                    'pointFillColor' : '#4a90e2',
                    'pointStrokeColor' : '#0066d6',
                   },
                   'thresholds': [
                      { name: 'Desirable', max: 200 },
                      { name: 'Borderline high', min: 200, max: 240 },
                      { name: 'High', min: 240 },
                    ]
                },
                'ldl-cholesterol' : {
                  'valueKeyPath': 'body.blood_ldl_cholesterol.value',
                  'range': { min: 0, max: 20 },
                  'seriesName': 'LDL Cholesterol',
                  'units': 'mg/dL',
                  'chart': {
                    'pointFillColor' : '#E24A4A',
                    'pointStrokeColor' : '#D60000',
                   }
                },
                'hdl-cholesterol' : {
                  'valueKeyPath': 'body.blood_hdl_cholesterol.value',
                  'range': { min: 0, max: 20 },
                  'units': 'mg/dL',
                  'seriesName': 'HDL Cholesterol',
                  'chart': {
                    'pointFillColor' : '#4AE250',
                    'pointStrokeColor' : '#00D605',
                   }
                },
                'triglycerides' : {
                  'valueKeyPath': 'body.blood_triglycerides.value',
                  'range': undefined,
                  'units': 'mg/dL',
                  'seriesName': 'Triglycerides',
                  'chart': {
                    'pointFillColor' : '#DA4AE2',
                    'pointStrokeColor' : '#CB00D6',
                   }
                },
              }
            };

      // Initialize the super class and extend it.
      angular.extend(vm, $controller('GenericChartController', {$scope: $scope}));

		  return vm;
		}
})();

(function() {
	angular.module('healthcafe.cholesterol')
		.factory('Cholesterol', Cholesterol );

  Cholesterol.$inject = [ 'Datapoints' ];

  function Cholesterol(Datapoints) {
    return Datapoints.getInstance(
      { namespace: 'nrc', name: 'cholesterol', version: '0.1' },
      function(data) {
        if( !data.total ) {
          return null;
        }

        var output = {
          'blood_total_cholesterol': { value: data.total, unit: 'mg/dL' },
        };

        if( data.ldl ) {
          output['blood_ldl_cholesterol'] = { value: data.ldl, unit: 'mg/dL' };
        }

        if( data.hdl ) {
          output['blood_hdl_cholesterol'] = { value: data.hdl, unit: 'mg/dL' };
        }

        if( data.triglycerides ) {
          output['blood_triglycerides'] = { value: data.triglycerides, unit: 'mg/dL' };
        }

        return output;
      }
    );
  }

})();

(function() {
	angular.module('healthcafe.cholesterol')
		.controller('CholesterolCreateController', CholesterolCreateController );

		CholesterolCreateController.$inject = [ '$scope', '$controller', 'Cholesterol' ];

		function CholesterolCreateController( $scope, $controller, Model ) {
		  var vm = this;

      $scope.model = Model;

      // Initialize the super class and extend it.
      angular.extend(vm, $controller('GenericCreateController', {$scope: $scope}));

		  return vm;
		}
})();

(function() {
	angular.module('healthcafe.generic')
		.controller('GenericChartController', GenericChartController );

		GenericChartController.$inject = ['$scope', '$ionicSideMenuDelegate', '$window']

    /**
     * Generic chart controller to handle a list of datapoints
     **/
    function GenericChartController($scope, $ionicSideMenuDelegate, $window) {
        var vm = this;

        vm.chart = null;

        // Returns an initialized chart object. The chart will be created if it doesn't exist yet.
        function getChart() {
          if( !vm.chart ) {
            // If no events are loaded, don't show a chart
            if( !$scope.events || $scope.events.length == 0 ) {
              return
            }

            function getDatapointDate(dataPoint) {
              if( dataPoint.body.effective_time_frame && dataPoint.body.effective_time_frame.date_time ) {
                return dataPoint.body.effective_time_frame.date_time;
              } else {
                return dataPoint.header.creation_date_time;
              }
            }

            // Sort by date ascending
            $scope.events.sort(function(a,b) {
              return getDatapointDate(a) - getDatapointDate(b);
            });

            $scope.events = $scope.events.map( function(datapoint) { return $scope.model.convertDates(datapoint, function(d) { return d.toJSON(); }); });

            createChart($scope.events.slice());
          }
          return vm.chart;
        }

        // Create a new chart
        function createChart(omhDataPoints) {
          if( vm.chart )
            vm.chart.destroy();

          var targetElement = d3.select($scope.selector);
          vm.chart = new OMHWebVisualizations.Chart( omhDataPoints, targetElement, $scope.chartableProperties, $scope.chartOptions );
        }

        // Show the chart
        function showChart() {
          var targetElement = d3.select($scope.selector);
          var chart = getChart();

          if( chart ) {
            var svg = targetElement.select('svg');
            svg.style( 'display', 'block' );
            chart.renderTo(svg.node());
          }
        }

        function load() {
          $scope.loading = true;
          $scope.events = [];
          $scope.model.list().then(function(data) {
            $scope.events = data;
            $scope.loading = false;

            showChart(data);
          });
        }

        function refresh() {
          $scope.loading = true;
          $scope.events = [];
          $scope.model.load().then(function(data) {
            $scope.events = data;
            $scope.loading = false;

            showChart(data);
          });
        }

        vm.remove = function(id) {
          $scope.model.remove(id).then(function() {
            refresh();
          });
        };

        // Start loading data
        load();

        // Disable dragging of side menu when a chart is shown
        $scope.$on('$ionicView.enter', function(){
          $ionicSideMenuDelegate.canDragContent(false);

          // Redraw the chart on resize
          angular.element($window).bind('resize', showChart);
        });
        $scope.$on('$ionicView.leave', function(){
          $ionicSideMenuDelegate.canDragContent(true);

          // Redraw the chart on resize
          angular.element($window).unbind('resize', showChart);
        });

        return vm;
    }
})();

(function() {
	angular.module('healthcafe.generic')
		.controller('GenericCreateController', GenericCreateController );

		GenericCreateController.$inject = ['$scope', '$ionicHistory']

  /**
   * Generic list controller to add a new datapoint
   **/
  function GenericCreateController($scope, $ionicHistory) {
    var vm = this;

    vm.data = typeof $scope.model.defaults != 'undefined' ? $scope.model.defaults() : {};

    vm.save = function() {
      $scope.model.create(vm.data)
        .then(function(data) {
          $scope.model.load().then(function() {
            $ionicHistory.goBack();
           });
        })
        .catch(function(e) {
          console.log( "Error saving data: ", e );
        });
    };

    return vm;
  }

})();

(function() {
	angular.module('healthcafe.generic')
		.factory('Datapoints', DatapointsFactory );

  DatapointsFactory.$inject = [ '$http', '$q', 'uuid2', 'OAuth2', 'config', '$indexedDB' ];

	function DatapointsFactory($http, $q, uuid2, OAuth2, config, $indexedDB) {

    /**
     * Constructor for a generic datapoint service. Available methods (returning a promise to perform the work async):
     *    load      Loads datapoints with the given schema from the NRC instance
     *    list      Returns datapoints with the given schema (from cache, if possible, otherwise using load())
     *    get       Returns a datapoint with the given ID
     *    remove    Removes a datapoint with the given ID
     *    create    Creates a new datapoint. Data specified is being converted using the converter (specified in the constructor)
     *
     *  The following methods return some metadata immediately
     *
     *    defaults  Returns a map with default values to show when a user creates a new datapoint
     *    chartableProperties Returns a comma-separated string with properties that can be charted for this datatype
     *
     * @param schema map with namespace, name and version, identifying the schema for this datatype
     * @param chartablePropertyNames Comma-separated string with properties that can be charted for this datatype
     * @param converter method to convert the data from a newly created dataobject (see GenericCreateController) into a OMH datapoint body
     */
    var Datapoints = function(schema, converter) {
      this.schema = schema;

      // Converter is needed to convert input data into a proper body for
      // the openmhealth API
      this.converter = converter;

      // Initialize empty cache
      this.cache = null;
    }

    Datapoints.prototype.load = function() {
      var deferred = $q.defer();
      var schema = this.schema

      $indexedDB.openStore( 'datapoints', function(datapointStore) {
        var query = datapointStore.query()
          .$index("schema")
          .$eq([schema.namespace, schema.name, schema.version]);

//        query = query.$eq([schema.namespace, schema.name, schema.version]);
//        query = query.$index("schema");

        datapointStore.findWhere(query).then(function(e) {
          deferred.resolve(e);
        }).catch(function(e) {
          deferred.reject(e);
        });
      });

      return deferred.promise;
    }

    Datapoints.prototype.list = function() {
      if( this.cache ) {
        return $q.when(this.cache);
      }

      return this.load()
    }

    Datapoints.prototype.get = function( id ) {
      var deferred = $q.defer();

      $indexedDB.openStore( 'datapoints', function(datapointStore) {
        datapointStore.find(id).then(function(e) {
          deferred.resolve(e);
        }).catch(function(e) {
          deferred.reject(e);
        });
      });

      return deferred.promise;
    }

    Datapoints.prototype.remove = function( id ) {
      var deferred = $q.defer();

      $indexedDB.openStore( 'datapoints', function(datapointStore) {
        datapointStore.delete(id).then(function(e) {
          deferred.resolve(e);
        }).catch(function(e) {
          deferred.reject(e);
        });
      });

      return deferred.promise;
    }

    Datapoints.prototype.create = function( body ) {
      // Convert data if appropriate
      if( this.converter ) {
        body = this.converter(body);
      }

      // If invalid data is specified, according to the converter,
      // tell the user
      if( !body ) {
        return $q.reject("Invalid data specified");
      }

      var deferred = $q.defer();

      // Create the datapoint itself
      var datapoint = this.createDatapoint(body);

      // Store the datapoint
      var schema = this.schema
      $indexedDB.openStore( 'datapoints', function(datapointStore) {
        datapointStore.insert(datapoint).then(function(e) {
          deferred.resolve(e);
        }).catch(function(e) {
          deferred.reject(e);
        });
      });

      return deferred.promise;
    }

    // Imports a datapoint or list of datapoints into the store
    // Existing data with the same ID will be overwritten
    Datapoints.prototype.import = function(data) {
      var deferred = $q.defer();

      // Handle dates, which are sent as string
      function parseDate(date) {
        if( date && typeof(date) == "string" ) {
          return new Date(date);
        } else {
          return date;
        }
      }

      if(Array.isArray(data)) {
        var that = this;
        data = data.map(function(datapoint) { return that.convertDates(datapoint, parseDate); } );
      } else if(typeof(data) == "object") {
        data = this.convertDates(data, parseDate);
      }

      // Store the datapoint
      $indexedDB.openStore( 'datapoints', function(datapointStore) {
        datapointStore.upsert(data).then(function(e) {
          deferred.resolve(e);
        }).catch(function(e) {
          deferred.reject(e);
        });
      });

      return deferred.promise;
    }

    // Convert all known dates for a single datapoint
    Datapoints.prototype.convertDates = function(datapoint, conversionMethod) {
      if(datapoint.header && datapoint.header.creation_date_time)
        datapoint.header.creation_date_time = conversionMethod(datapoint.header.creation_date_time);

      if(datapoint.header && datapoint.header.acquisition_provenance && datapoint.header.acquisition_provenance.source_creation_date_time)
        datapoint.header.acquisition_provenance.source_creation_date_time = conversionMethod(datapoint.header.acquisition_provenance.source_creation_date_time);

      if( datapoint.body && datapoint.body.effective_time_frame && datapoint.body.effective_time_frame.date_time)
        datapoint.body.effective_time_frame.date_time = conversionMethod(datapoint.body.effective_time_frame.date_time);

      return datapoint;
    }

    // Default values for the datapoint when creating one
    Datapoints.prototype.defaults = function() {
      return {};
    }

    /**
     * Returns a comma-separated-string with properties that can be charted for this datatype. See OMH Web Visualizations
     */
    Datapoints.prototype.chartableProperties = function() {
      return this.propertyNames;
    }

    Datapoints.prototype.createDatapoint = function( body ) {
      // Store effective date_time
      body.effective_time_frame = { date_time: new Date() };

      return {
        header: {
          id: uuid2.newuuid(),
          creation_date_time: new Date(),
          acquisition_provenance: {
            source_name: 'Manual',
            source_creation_date_time: new Date(),
            modality: 'self-reported'
          },
          schema_id: this.schema
        },
        body: body
      }
    }

    return {
      getInstance: function( schema, converter ) {
        return new Datapoints(schema, converter)
      },
    };
  }
})();


(function() {
	angular.module('healthcafe.generic')
		.controller('GenericDetailController', GenericDetailController );

		GenericDetailController.$inject = ['$scope', '$state', 'Datapoints']

  /**
   * Generic controller to show details about a datapoint
   **/
  function GenericDetailController($scope, $state, DatapointsFactory) {
    var vm = this;

    vm.measurementId = $state.params.measurementId;
    vm.measurement = null;

    // Get anonymous instance, since we don't care about the specific schema
    var model = DatapointsFactory.getInstance();

    // Load the datapoint
    model.get(vm.measurementId)
      .then(function(dataPoint) {
        vm.measurement = dataPoint;

        if( dataPoint.body.effective_time_frame && dataPoint.body.effective_time_frame.date_time ) {
          date = dataPoint.body.effective_time_frame.date_time;
        } else {
          date = dataPoint.header.creation_date_time;
        }

        vm.date = date;
      })
      .catch(function(e) {
        console.log( "Error loading data: ", e );
      });

    return vm;
  }

})();

(function() {
	angular.module('healthcafe.generic')
		.controller('GenericInfoController', GenericInfoController );

  /**
   * Generic list controller to show information about a datatype
   **/
  function GenericInfoController() {
    var vm = this;
    return vm;
  }

})();

(function() {
	angular.module('healthcafe.intro')
		.controller('IntroController', IntroController );

	IntroController.$inject = [ '$scope', '$ionicHistory' ];

	function IntroController($scope, $ionicHistory) {
	  var vm = this;

    // Method to reset navigation and disable back on the next page
    vm.resetNav = function() {
      $ionicHistory.nextViewOptions({
        disableBack: true,
      });
    }

		return this;
	}
})();

(function() {
	angular.module('healthcafe.login')
		.factory('OAuth2', OAuth2 );

	OAuth2.$inject = [ 'config' ];

	function OAuth2(config) {
    function getToken(service) {
      var token = window.localStorage.getItem("token-" + service);

      if( token ) {
        return JSON.parse(token);
      }

      return null;
    }

    function isAuthenticated(service) {
      return !!getToken(service);
    }

    function getAccessToken(service) {
      var token = getToken(service);

      if( token ) {
        return token.oauth.access_token
      } else {
        return null;
      }
    }

    function getRefreshToken() {

    }

    function login(service, redirect) {
      // Make sure the oauth callback page knows where to redirect the user
      window.localStorage.setItem( "redirect-" + service, redirect );

      // Generate login URL
      var apiConfig = config.current().api;
      var serviceConfig = apiConfig.oauth[service];
      var serviceUrls = serviceConfig.urls;

      url = serviceUrls.authorization +
              "?client_id=" + serviceConfig.key +
              "&redirect_uri=" + encodeURIComponent(serviceUrls.redirect) +
              "&response_type=token" +
              "&scope=read_data_points write_data_points delete_data_points"

      window.location.href = url;
    }

    function logoff(service) {
      // Remove item from local storage
      window.localStorage.removeItem("token-" + service);
    }

    return {
      isAuthenticated: isAuthenticated,
      getAccessToken: getAccessToken,
      login: login,
      logoff: logoff
    }
  }
})();


(function() {
	angular.module('healthcafe.login')
		.factory('OAuth2Interceptor', OAuth2Interceptor );

	OAuth2Interceptor.$inject = [ 'OAuth2', '$rootScope', '$q' ];
	function OAuth2Interceptor(OAuth2, $rootScope, $q) {
    // Interceptor method to add access token to every request
    // See https://docs.angularjs.org/api/ng/service/$http
    function request(config) {
      if(config.oauth) {
        config.headers[ 'Authorization' ] = 'Bearer ' + OAuth2.getAccessToken(config.oauth)
      }

      return config;
    }

    // Interceptor method to redirect the user to the login form, if a 401 is returned
    function responseError(rejection) {
      var config = rejection.config || {};
      if (!config.ignoreAuthModule) {
        switch (rejection.status) {
          case 401:
            // Redirect the user to the login form
            $rootScope.$broadcast('event:auth-unauthorized', rejection);
            break;
          case 403:
            $rootScope.$broadcast('event:auth-forbidden', rejection);
            break;
        }
      }

      // otherwise, default behaviour
      return $q.reject(rejection);
    }

    return {
      request: request,
      responseError: responseError
    }
  }
})();


(function() {
	angular.module('healthcafe.remarks')
		.controller('RemarksController', RemarksController );

		RemarksController.$inject = [ 'Remarks' ];

		function RemarksController(Model) {
      var vm = this;

      function load() {
        vm.remarks = []
        Model.list().then(function(data) {
          vm.remarks = data;
        });
      }

      function refresh() {
        vm.remarks = []
        Model.load().then(function(data) {
          vm.remarks = data;
        });
      }

      vm.remove = function(id) {
        Model.remove(id).then(function() {
          refresh();
        });
      };

      load();

      return vm;
		}
})();

(function() {
	angular.module('healthcafe.remarks')
		.factory('Remarks', Remarks );

  Remarks.$inject = [ '$q', '$indexedDB' ];

  function Remarks($q, $indexedDB) {
    var cache = null;

    function load() {
      var deferred = $q.defer();

      $indexedDB.openStore( 'remarks', function(remarksStore) {
        remarksStore.getAll().then(function(e) {
          deferred.resolve(e);
        }).catch(function(e) {
          deferred.reject(e);
        });
      });

      return deferred.promise;
    }

    function list() {
      if(cache) {
        return $q.when(cache);
      }

      return load();
    }

    function get(id) {
      var deferred = $q.defer();

      $indexedDB.openStore( 'remarks', function(remarksStore) {
        remarksStore.get(id).then(function(e) {
          deferred.resolve(e);
        }).catch(function(e) {
          deferred.reject(e);
        });
      });

      return deferred.promise;
    }

    function remove(id) {
      var deferred = $q.defer();

      $indexedDB.openStore( 'remarks', function(remarksStore) {
        remarksStore.delete(id).then(function(e) {
          deferred.resolve(e);
        }).catch(function(e) {
          deferred.reject(e);
        });
      });

      return deferred.promise;
    }

    function create(body) {
      var deferred = $q.defer();

      // Store the remark
      $indexedDB.openStore( 'remarks', function(remarksStore) {
        remarksStore.insert(body).then(function(e) {
          deferred.resolve(e);
        }).catch(function(e) {
          deferred.reject(e);
        });
      });

      return deferred.promise;
    }

    return {
      create: create,
      load: load,
      list: list,
      remove: remove,
      get: get,

      defaults: function() { return {
        date: new Date(),
      }; }
    }
  }

})();


(function() {
	angular.module('healthcafe.remarks')
		.controller('RemarksCreateController', RemarksCreateController );

		RemarksCreateController.$inject = [ '$scope', '$controller', 'Remarks' ];

		function RemarksCreateController( $scope, $controller, Model ) {
		  var vm = this;

      $scope.model = Model;

      // Initialize the super class and extend it.
      angular.extend(vm, $controller('GenericCreateController', {$scope: $scope}));

		  return vm;
		}
})();

(function() {
	angular.module('healthcafe.sharing')
		.controller('ConnectController', ConnectController );

		ConnectController.$inject = [ '$state', 'OAuth2', 'config'];

		function ConnectController($state, OAuth2, config) {
      var vm = this;

      var serviceKey = $state.params.service;

      // Check whether this user is already connected
      if( OAuth2.isAuthenticated(serviceKey) ) {
        $state.go("app.share", { service: serviceKey });
        return;
      }

      // Add information about the current service
      vm.serviceKey = serviceKey;
      vm.service = config.sharing[serviceKey];

      // Method to start connecting with the current service
      vm.login = function() {
        // Login using OAuth and redirect to the sharing page afterwards
        OAuth2.login(serviceKey, '/app/share/' + serviceKey )
      }

      return vm;
		}
})();

(function() {
	angular.module('healthcafe.sharing')
		.controller('ShareController', ShareController );

		ShareController.$inject = [ '$state', '$ionicHistory', '$ionicPopup', 'OAuth2', 'config', 'Share'];

		function ShareController($state, $ionicHistory, $ionicPopup, OAuth2, config, Share) {
      var vm = this;

      var serviceKey = $state.params.service;

      // Check whether this user is already connected
      if( !OAuth2.isAuthenticated(serviceKey) ) {
        $ionicHistory.nextViewOptions({
          disableBack: true
        });

        $state.go("app.connect", { service: serviceKey });
        return;
      }

      // Add information about the current service
      vm.serviceKey = serviceKey;
      vm.service = config.sharing[serviceKey];

      // Show the datatypes for the user to choose.
      var datatypes = config.datatypes.slice();

      // By default, all items are checked
      for( i in datatypes ) {
        datatypes[i].checked = true;
      }
      vm.datatypes = datatypes;

      // Method to import data
      vm.importing = false;
      vm.import = function() {
        vm.importing = true;
        Share.pull(serviceKey, vm.datatypes)
          .then(function(e) {
            vm.importing = false;

            var numDatapoints = e.reduce(function(previousSum, currentIds) { return previousSum + (currentIds ? currentIds.length : 0); }, 0);
            $ionicPopup.alert({
              "title": "Import succeeded",
              "template": "" + numDatapoints + " data point(s) have been imported into your app."
            }).then(function(res) {
              // After popup, go to the timeline
              $state.go("app.timeline");
            });
          }).catch(function(response) {
            vm.importing = false;

            // If any of the request fails with a 401 error, the access token
            // has most probably expired. Send the user to the login page again.
            if(response.status == 401) {
              $ionicPopup.alert({
                "title": "Credentials expired",
                "template": "Unfortunately your credentials have expired. Please allow the application access."
              }).then(function(res) {
                // After popup, go to the login screen
                OAuth2.logoff(serviceKey);
                $state.go("app.connect", { service: serviceKey });
              });
            } else {
              $ionicPopup.alert({
                "title": "Sharing error",
                "template": "An error occurred while importing data from " + vm.service.label + ". Please contact an administrator.<br /><br />" + response.status + ": " + response.data.error
              });
            }
          });
      }

      vm.exporting = false;
      vm.export = function() {
        vm.exporting = true;
        Share.push(serviceKey, vm.datatypes)
          .then(function(e) {
            vm.exporting = false;
            var numDatapoints = e.reduce(function(previousSum, currentIds) { return previousSum + (currentIds ? currentIds.length : 0); }, 0);
            $ionicPopup.alert({
              "title": "Share succeeded",
              "template": "" + numDatapoints + " data point(s) have been shared with " + vm.service.label + "."
            }).then(function(res) {
              // After popup, go to the timeline
              $state.go("app.timeline");
            });
          }).catch(function(response) {
            vm.exporting = false;

            // If any of the request fails with a 401 error, the access token
            // has most probably expired. Send the user to the login page again.
            if(response.status == 401) {
              $ionicPopup.alert({
                "title": "Credentials expired",
                "template": "Unfortunately your credentials have expired. Please allow the application access."
              }).then(function(res) {
                // After popup, go to the login screen
                OAuth2.logoff(serviceKey);
                $state.go("app.connect", { service: serviceKey });
              });
            } else {
              $ionicPopup.alert({
                "title": "Sharing error",
                "template": "An error occurred while sharing data with " + vm.service.label + ". Please contact an administrator.<br /><br />" + response.status + ": " + response.data.error
              });
            }
          });
      }


      return vm;
		}
})();

(function() {
	angular.module('healthcafe.sharing')
		.factory('Share', Share );

  Share.$inject = [ '$indexedDB', '$q', '$http', 'config', 'BloodPressure', 'BodyWeight', 'BMI', 'BloodGlucose', 'Cholesterol' ];

  function Share($indexedDB, $q, $http, config, BloodPressure, BodyWeight, BMI, BloodGlucose, Cholesterol) {
    var cache = null;

    function pull(serviceKey, selectedDatatypes) {
      var serviceConfig = config.sharing[serviceKey];
      var models = getModelsForSelectedDatatypes(selectedDatatypes);

      if( !serviceConfig ) {
        console.error( "Importing data from invalid service", serviceKey );
        return $q.reject( "Importing data from invalid service");
      }

      switch( serviceConfig.type ) {
        case "openmhealth":
          return openmHealthImport(serviceKey, models);
        default:
          console.error( "Service type for given service is not supported", serviceKey, serviceConfig.type );
          return $q.reject("Service type for given service is not supported");
      }
    }

    function push(serviceKey, selectedDatatypes) {
      var serviceConfig = config.sharing[serviceKey];
      var models = getModelsForSelectedDatatypes(selectedDatatypes);

      if( !serviceConfig ) {
        console.error( "Exporting data to invalid service", serviceKey );
        return $q.reject( "Exporting data to invalid service");
      }

      switch( serviceConfig.type ) {
        case "openmhealth":
          return openmHealthExport(serviceKey, models);
        default:
          console.error( "Service type for given service is not supported", serviceKey, serviceConfig.type );
          return $q.reject("Service type for given service is not supported");
      }
    }

    /**
     * Returns a list of models for the selected datatypes
     */
    function getModelsForSelectedDatatypes(selectedDatatypes) {
      return selectedDatatypes
        .filter(function(datatype) { return datatype.checked; })
        .map(function(datatype) {
          switch( datatype.name ) {
            case 'bloodpressure': return BloodPressure;
            case 'bloodglucose':  return BloodGlucose;
            case 'bodyweight':    return BodyWeight;
            case 'cholesterol':   return Cholesterol;
            case 'bmi':           return BMI;
            default: console.error( "Invalid datatype selected", datatype.name ); return null;
          }
        });
    }

    // Specific import and export methods
    // Currently there is only a single one for openmhealth
    // TODO: Refactor in such a way that multiple types of services are easily supported
    /**
     * Imports data from openmhealth endpoint
     */
    function openmHealthImport(serviceKey, models) {
      var serviceConfig = config.current().api.oauth[serviceKey];

      if( !serviceConfig ) {
        console.error( "OAuth parameters for given service are not provided in configuration", serviceKey );
        return $q.reject("OAuth parameters for given service are not provided in configuration");
      }

      return $q.all(
        models.map(function(model) {
          // Blood glucose
          var url = serviceConfig.urls.dataPoints +
                      '?schema_namespace=' + encodeURIComponent(model.schema.namespace) +
                      '&schema_name=' + encodeURIComponent(model.schema.name) +
                      '&schema_version=' + encodeURIComponent(model.schema.version);

          return $http.get( url, { oauth: serviceKey } ).then(function(response) {
            // Handle data points. Assuming the UUIDs are actually unique, we may still
            // find the datapoint already existing in our local storage (e.g. when data
            // was entered here and shared with the remote endpoint, or data was imported
            // before). In that case, we will overwrite the existing data.
            return model.import(response.data);
          });
        })
      );
    }

    /**
     * Exports data to openmhealth endpoint
     */
    function openmHealthExport(serviceKey, models) {
      var serviceConfig = config.current().api.oauth[serviceKey];

      if( !serviceConfig ) {
        console.error( "OAuth parameters for given service are not provided in configuration", serviceKey );
        return $q.reject("OAuth parameters for given service are not provided in configuration");
      }

      return $q.all(
        models.map(function(model) {
          return model.list().then(function(datapoints) {

            var url = serviceConfig.urls.dataPoints;

            return $q.all(
              datapoints.map(function(datapoint) {
                // Convert any date into an ISO8601 formatted string
                function serializeDate(date) {
                  if( typeof( date ) == "object" ) {
                    return date.toJSON();
                  } else {
                    return date;
                  }
                }

                datapoint = model.convertDates(datapoint, serializeDate);

                // Create a separate promise to return, as we should
                // resolve the promise if a 409 response is given (already exists)
                // The HTTP object itself will fail in that case
                var deferred = $q.defer();
                $http.post( url, datapoint, { oauth: serviceKey } )
                  .then(function(response) {
                    deferred.resolve(response);
                  })
                  .catch(function(response) {
                    if( response.status == 409 ) {
                      deferred.resolve(response);
                    } else {
                      deferred.reject(response);
                    }
                  });

                return deferred.promise;
              })
            );
          });
        })
      );
    }

    return {
      pull: pull,
      push: push,
    }
  }

})();


(function() {
	angular.module('healthcafe.timeline')
		.controller('TimelineController', TimelineController );

		TimelineController.$inject = [ 'BloodPressure', 'BodyWeight', 'BMI', 'BloodGlucose', 'Cholesterol', 'Remarks', '$q', '$ionicPopover', '$timeout', '$state'];

		function TimelineController(BloodPressure, BodyWeight, BMI, BloodGlucose, Cholesterol, Remarks, $q, $ionicPopover, $timeout, $state) {
      var vm = this;

      var definitions = {
        'blood-pressure': { icon: 'ion-heart', model: BloodPressure },
        'body-weight': { icon: 'ion-speedometer', model: BodyWeight},
        'body-mass-index': { icon: 'ion-ios-flame', model: BMI},
        'blood-glucose': { icon: 'ion-fork', model: BloodGlucose},
        'cholesterol': { icon: 'ion-waterdrop', model: Cholesterol},
      };

      /**
       * Converts a blood pressure datapoint into an event on the timeline
       */
      function convertDatapoint(dataPoint) {
        if( dataPoint.body.effective_time_frame && dataPoint.body.effective_time_frame.date_time ) {
          date = dataPoint.body.effective_time_frame.date_time;
        } else {
          date = dataPoint.header.creation_date_time;
        }

        var schemaName = dataPoint.header.schema_id.name;

        return {
          id: dataPoint.header.id,
          datapoint: dataPoint,
          date: date,
          badgeIconClass: definitions[schemaName].icon,
          badgeClass: dataPoint.header.schema_id.name,
          type: 'measurement',
          measurementType: schemaName,
          model: definitions[schemaName].model,
          showDetail: function() {
            var typeName;
            switch(schemaName) {
              case 'body-mass-index':   typeName = 'bmi'; break;
              default:                  typeName = schemaName.replace( /-/g, '' ); break;
            }
            $state.go( 'app.' +  typeName + '_measurement', { measurementId: dataPoint.header.id } );
          }
        };
      }

      /**
       * Converts an intervention into an event on the timeline
       */
      function convertIntervention(intervention) {
        return angular.extend({}, intervention, {
          badgeIconClass: 'ion-flash',
          badgeClass: 'remark',
          type: 'intervention',
          model: Remarks,
          showDetail: function() { return false; }
        });
      }

      /**
       * Combines datapoints and inverventions into a single list
       * @param data  List with lists of datapoints or remarks
       */
      function combine( data ) {
        var events = flatten(
          data.map(function(entries) {
            return entries.map(function(element) {
              // Convert each element into the proper format
              // See convertDatapoint and convertIntervention for details
              if( element.header && element.body ) {
                return convertDatapoint(element);
              } else {
                return convertIntervention(element)
              }
            });
          })
        );

        // Sort by date descending
        return events.sort(function(a,b) {
          return new Date(b.date) - new Date(a.date);
        });
      }

      function flatten(arrays) {
        return [].concat.apply([], arrays);
      }

      function load(models) {
        vm.loading = true;
        vm.events = []
        $q.all( models.map(function(model) { return model.list() } ) ).then(function(data) {
          vm.events = combine(data);
        }).then(function() {
          vm.loading = false;
        });
      }

      // Allow the client to reload
      vm.load = function() {
        var models = [BloodPressure, BodyWeight, BloodGlucose, BMI, Cholesterol, Remarks];
        load(models);
      }

      // Load the data on startup
      vm.load();

      // Enable deleting events
      vm.remove = function(event) {
        if(confirm('Are you sure?')) {
          // Perform the actual removal
          event.model.remove(event.id)
            // First tell the frontend the removing succeeded and wait 200ms for the animation to be finished
            .then(function() { event.removed = true; return $timeout(function() {}, 200); })

            // After that, do the real reloading of the data in the backend. THis will actually
            // delete the element from the cache and from the DOM
            .then(function() { return event.model.load(); })
            .then(function() { return vm.load(); })
        }

        return false;
      }

      // Enable the popover when clicking the add button
      $ionicPopover.fromTemplateUrl('app/timeline/add_menu.html').then(function(popover) {
        vm.popover = popover;
      });

      return vm;
		}
})();
