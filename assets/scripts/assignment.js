
require(['jquery', 'fuzzy-time'], function($) {
	//alert('assignment 4 lol!')
		
	$(function() {
		$('.assignment').on('click', '.section-collapse', function() {
			$(this).closest('section').toggleClass('collapsed');
			return false;
		});

		$('.due time').timeago();
	})
});
