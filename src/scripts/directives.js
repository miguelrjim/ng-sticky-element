(function (window, angular, undefined) {
  'use strict';

  var DEFAULT_CLASS = 'afkl-sticky-element';
  var STICKY_CLASS = 'afkl-sticky-element--sticky';
  var VISIBLE_CLASS = 'afkl-sticky-content--visible';

  var BOTTOM = 'bottom';
  var TOP = 'top';

  var POLLING_DELAY = 200;

  angular.module('afklStickyElement.directives', []).directive('afklStickyElement', ['$window', '$document', '$timeout', function ($window, $document, $timeout) {
    return {
      restrict: 'A',
      link: function link(scope, $element, attrs) {
        $element.addClass(DEFAULT_CLASS);

        var
          stickTo = attrs.afklStickyElement === BOTTOM ? BOTTOM : TOP,
          intervalID = null,
          body = $document[0].body,
          lastBodyHeight = body.offsetHeight,
          elPos = null,
          isOnStickyMode = false,
          element = $element[0],
          $win = angular.element($window),
          mediaQuery = attrs.afklStickyElementMq,
          offset = attrs.afklStickyElementOffset ? parseInt(attrs.afklStickyElementOffset) : 0,
          shouldPoll = !!scope.$eval(attrs.afklStickyElementPolling || 'true'),
          id = attrs.afklStickyElementId,
          watchFn;

        if(shouldPoll) {
          $win.bind('blur', stopPollingContentHeight);
          $win.bind('focus', startPollingContentHeight);
        }
        if(id)
          watchFn = scope.$on('afklStickyElement:'+id, updateState);
        $win.bind('scroll', updateState);
        $win.bind('resize', updateState);

        // wait first directives to be rendered,
        // so we can get proper position values:
        $timeout(function () {
          // make the element temporarily visible:
          $element.addClass(VISIBLE_CLASS);
          updateState();
          $element.removeClass(VISIBLE_CLASS);

          if(shouldPoll)
            startPollingContentHeight();
        }, 0);

        function startPollingContentHeight() {
          intervalID = $window.setInterval(checkContentHeightAndUpdate, POLLING_DELAY);
        }

        function stopPollingContentHeight() {
          $window.clearInterval(intervalID);
        }

        function checkContentHeightAndUpdate() {
          if (lastBodyHeight !== body.offsetHeight) {
            lastBodyHeight = body.offsetHeight;
            updateState();
          }
        }

        function updateState() {
          if (element.offsetWidth === 0 || element.offsetHeight === 0) {
            return;
          }

          clearStickiness();

          if (mediaQuery && !$window.matchMedia(mediaQuery).matches) {
            return;
          }

          calculateElementPosition();

          if (isStickyState()) {
            addStickiness();
          }
        }

        function calculateElementPosition() {
          elPos = stickTo === TOP ? $window.pageYOffset + element.getBoundingClientRect().top : $window.pageYOffset + element.getBoundingClientRect().top + element.offsetHeight;

          return elPos;
        }

        function isStickyState() {
          return stickTo === TOP ? $window.pageYOffset > elPos - offset : $window.pageYOffset + $window.innerHeight < elPos + offset;
        }

        function clearStickiness() {
          if (isOnStickyMode) {
            isOnStickyMode = false;
            $element.css('width', null);
            $element.removeClass(STICKY_CLASS).css('padding-'+stickTo, null);
          }
        }

        function addStickiness() {
          if (!isOnStickyMode) {
            isOnStickyMode = true;
            $element.css('width', $element[0].offsetWidth + 'px');
            $element.addClass(STICKY_CLASS).css('padding-'+stickTo, offset + 'px');
          }
        }

        $element.on('$destroy', function () {
          if(id)
            watchFn();
          if(shouldPoll) {
            stopPollingContentHeight();
            $win.unbind('blur', stopPollingContentHeight);
            $win.unbind('focus', startPollingContentHeight);
          }
          $win.unbind('scroll', updateState);
          $win.unbind('resize', updateState);
        });
      }
    };
  }]);
})(window, window.angular);