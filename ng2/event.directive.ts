.directive('gaTrackEvent', ['Analytics', '$parse', function (Analytics, $parse) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var options = $parse(attrs.gaTrackEvent);
            element.bind('click', function () {
                if(attrs.gaTrackEventIf){
                    if(!scope.$eval(attrs.gaTrackEventIf)){
                        return; // Cancel this event if we don't pass the ga-track-event-if condition
                    }
                }
                if (options.length > 1) {
                    Analytics.trackEvent.apply(Analytics, options(scope));
                }
            });
        }
    };
}]);