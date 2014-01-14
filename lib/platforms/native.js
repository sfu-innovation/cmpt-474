
//Implement this so people without LXC (and thus not root) 
//can actually do something

function NativePlatform() {
	throw new Error('not yet implemented')
}

module.exports = NativePlatform;