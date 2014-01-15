
//Implement this so people without LXC (and thus not root) 
//can actually do something

function NativePlatform(config) {
	throw new Error('not yet implemented')
}

NativePlatform.prototype.put = function() {

}

NativePlatform.prototype.del = function() {

}

NativePlatform.prototype.get = function() {
	
}

module.exports = NativePlatform;