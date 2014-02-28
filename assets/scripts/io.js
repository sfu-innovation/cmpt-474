
define(['events', 'util'], function(events, util) {
	
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
	util.inherits(IO, events.EventEmitter);

	return IO;
})