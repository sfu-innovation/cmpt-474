define(['scroll.easy'], function(EasyScroller) {


	function Timeline(container, options) {
		if (this instanceof Timeline === false) return new Timeline(container, options);
		this.container = container;
		options = options || { };
		this.scroller = new EasyScroller(container.querySelector('.entities'), {
			scrollingX: true,
			scrollingY: false,
			zooming: false,
			minZoom: 0,
			maxZoom: 0
		});
		this.scroller.scroller.scrollTo(0, 0);
		this.tickInterval = options.tickInterval || 1; //Time intervals per tick
		this.tickDistance = options.tickDistance || 5; //Spacing intervals per tick
		this.zoom = 1.0; //1 pixel per timeunit
		this.start = options.start || 0;
		this.end = options.end || 1000;
		this.ticks = container.querySelector('.ticks');
		this.events = container.querySelector('.events');
		this.active = undefined;

		this.updateTicks();

		this.events.style.width = (this.end/this.tickInterval*this.tickDistance)+'px';
		this.scroller.reflow();

		var self = this;
		for (var i = 0; i < 30; ++i)
			self.addEvent({ text: 'testing ', start: Math.random()*1000 })
		//}, 5000)
	
		container.tabIndex = 0;
		container.addEventListener('mouseenter', function() {
			this.focus();
		});
		container.addEventListener('mouseleave', function() {
			this.blur();
		})
		container.addEventListener('keydown', function(evt) {
			switch(evt.keyCode) {
			case 37: //left
				evt.preventDefault();
				self.backward();
				break;
			case 39: //right
				evt.preventDefault();
				self.forward();
				break;
			}
		})
	}

	Timeline.prototype.createTick = function(timecode) {
		var doc = this.container.ownerDocument,
			tick = doc.createElement('div'), 
			label = doc.createElement('span');
		tick.classList.add('tick');
		label.classList.add('label');
		tick.appendChild(label);
		tick.style['-webkit-transform'] = 'translate3d(' + (timecode*this.tickDistance+this.tickInterval*this.tickDistance) + 'px,' + (0) + 'px,0)';
		this.ticks.appendChild(tick);
		return tick;
	}

	Timeline.prototype.activate = function(event) {
		if (this.active) this.active.classList.remove('active');
		this.active = event;
		if (this.active) {
			this.active.classList.add('active');
			this.scroller.scrollTo(this.active.dataset.eventStart*this.tickDistance, 0, true);
		}
	}

	Timeline.prototype.forward = function() {
		if (!this.active) this.activate(this.events.firstElementChild);
		else this.activate(this.active.nextElementSibling);
	}

	Timeline.prototype.backward = function() {
		if (!this.active) this.activate(this.events.lastElementChild);
		else this.activate(this.active.previousElementSibling);
	}

	Timeline.prototype.updateTicks = function() {
		for (var i = this.start; i < this.end; i+= this.tickInterval) {
			this.createTick(i);
		}
		
	}

	Timeline.prototype.addEvent = function(event) {
		var self = this,
			doc = this.container.ownerDocument,
			container = doc.createElement('div'),
			div = doc.createElement('div'),
			content = doc.createElement('p');

		content.textContent = event.text;

		container.classList.add('event');
		container.appendChild(div);
		div.classList.add('content');
		container.dataset.eventId = event.id;
		container.dataset.eventStart = event.start;
		div.appendChild(content);
		container.style['-webkit-transform'] = 'translate3d(' + (event.start*this.tickDistance) + 'px,' + (0) + 'px,0)';
		container.addEventListener('click', function(evt) {
			evt.preventDefault();
			self.activate(container);
		})

		
		var start = 0, end = this.events.children.length - 1, before = undefined;  

		while (start <= end)   
		{  
			var middle = start + Math.floor((end - start)/2);
			if (this.events.children[middle].dataset.eventStart === event.start) 
				break; 
			else if (this.events.children[middle].dataset.eventStart > event.start)    
				before = this.events.children[middle], end = middle - 1;  
			else 
				start = middle + 1; 
		} 

		this.events.insertBefore(container, before);
	}

	Timeline.prototype.reflow = function() {

	}

	Timeline.prototype.zoom = function(zoom) {
		this.tickDistance = zoom;
	}

	return Timeline;
})