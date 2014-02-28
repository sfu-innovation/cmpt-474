
require(['jquery', 'fuzzy-time'], function($) {
	//alert('assignment 4 lol!')
		
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
		})
	})
});
