
require(['timeline'], function(Timeline) {
	
	
	var timeline = Timeline(document.querySelector('.timeline'));

	document.querySelector('.timeline-navigation.previous').addEventListener('click', function(evt) {
		evt.preventDefault();
		timeline.backward();
		return false;
	})

	document.querySelector('.timeline-navigation.next').addEventListener('click', function(evt) {
		evt.preventDefault();
		timeline.forward();
		return false;
	})

	var docElem = document.documentElement,
		header = document.querySelector( 'header' ),
		didScroll = false,
		changeHeaderOn = 150;

	function init() {
		window.addEventListener( 'scroll', function( event ) {
			if( !didScroll ) {
				didScroll = true;
				setTimeout( scrollPage, 150 );
			}
		}, false );
	}

	function scrollPage() {
		var sy = scrollY();
		if ( sy >= changeHeaderOn ) {
			header.classList.add( 'shrink' );
		}
		else {
			header.classList.remove( 'shrink' );
		}
		didScroll = false;
	}

	function scrollY() {
		return window.pageYOffset || docElem.scrollTop;
	}

	init();
		

});
