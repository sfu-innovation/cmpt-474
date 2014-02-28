
requirejs.config({
	paths: {
		'sockjs': [ 'http://cdn.sockjs.org/sockjs-0.3.min' ]
	}
})

require(['jquery', 'fuzzy-time', 'spinner', 'sockjs', 'event-emitter', 'util'], function($, fz, Spinner, SockJS, EventEmitter, util) {
	//alert('assignment 4 lol!')

	function IO(opts) {
		EventEmitter.call(this);
		//var path = window.location.protocol+'//'+window.location.host+'/io';
		var path = '/io';
		this.socket = new SockJS(path);
		this.socket.onopen = function() {
			console.log('OPEN')
		}
		this.socket.onmessage = function() {
			console.log('MESSAGE')
		}
		this.socket.onclose = function() {
			console.log('CLOSE')
		}
	}
	util.inherits(IO, EventEmitter);

	var io = new IO();


	$(function() {
		$('.assignment').on('click', '.section-collapse', function() {
			$(this).closest('section').toggleClass('collapsed');
			return false;
		});

		$('time').timeago();


		var colors = {
			
		}

		var letterGrades = {
			0.95: 'A+',
			0.9: 'A',
			0.85: 'A-',
			0.8: 'B+',
			0.75: 'B',
			0.7: 'B-',
			0.65: 'C+',
			0.6: 'C',
			0.55: 'C-',
			0.5: 'D',
			0: 'F'
		};

		var entries = Object.keys(letterGrades).map(parseFloat).sort(function(a,b) {
			return b - a;
		})

		$('.result[data-score]').each(function() {
			var score = parseFloat($(this).data('score'));

			var i = 0;
			while (entries[i] > score)
				++i;
			

			$(this).html((score*100).toFixed(2)+'%' + ' - ' + letterGrades[entries[i]]);
		});
	})
});
