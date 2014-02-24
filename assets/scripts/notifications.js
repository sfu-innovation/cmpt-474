
define(['socket.io'], function(io) {
	
	
	function NotificationCenter(container, socket) {
		var self = this;
		this.container = container;
		this.socket = socket;
		socket.on('notification', function(notification) {
			self.post(notification);
		});
		this.audio = container.ownerDocument.createElement('audio');
		this.audio.src = '/sounds/notification.m4a';
		this.audio.preload = true;
	}

	NotificationCenter.prototype.send = function(notification) {
		socket.emit('notification', notification);
	}

	NotificationCenter.prototype.post = function(notification) {
		var 
			closed = false,
			d = this.container.ownerDocument,
			container = d.createElement('div'),
			content = d.createElement('div'),
			main = d.createElement('div'),
			dismiss = d.createElement('a'),
			icon = d.createElement('img'),
			title = d.createElement('h1'),
			body = d.createElement('span'),
			actions = d.createElement('div');

		container.appendChild(content);
		content.appendChild(dismiss);
		if (notification.icon) {
			content.appendChild(icon);
			icon.src = notification.icon;
		}

		if (notification.actions) {
			for (var i = 0; i < notification.actions.length; ++i) {
				var action = notification.actions[i], item = d.createElement('a');
				item.href = action.href;
				item.textContent = action.title;
				if (action.description)
					item.title = action.description;
				if (action.default) {
					item.classList.add('default')
					content.addEventListener('click', function(e) {
						//Aren't we fancy, proxying the event and all
						var evt = document.createEvent( "MouseEvent" );
						evt.initMouseEvent(e.type, e.canBubble, e.cancelable, e.view, e.detail, e.screenX, e.screenY, e.clientX, e.clientY, e.ctrlKey, e.altKey, e.shiftKey, e.metaKey, e.button, e.relatedTarget);
						item.dispatchEvent(evt);

					})
				}
				item.addEventListener('click', function() {
					//in addition to normal actions, signal dismissal
					//unfortunately if using something other than AJAX this
					//will most likely do nasty things
					dismissal()
				})
				actions.appendChild(item);
			}
		}
		content.appendChild(main);
		main.appendChild(title);
		main.appendChild(body);
		main.appendChild(actions);

		function dismissal() {
			//mark notification as read
			close();
		}

		function close() {
			if (closed) return;
			closed = true;
			container.classList.add('hidden');
			setTimeout(function(){ 
				container.parentNode.removeChild(container);
			}, 3000);
			
		}

	
		
		if (notification.duration) 
			setTimeout(close, notification.duration+1000);
		
		container.classList.add('notification');
		main.classList.add('main');
		content.classList.add('content');
		actions.classList.add('actions');

		title.textContent = notification.title;
		body.textContent = notification.body;

		dismiss.href = '/notifications/'+notification.id+'/dismiss';
		dismiss.classList.add('dismiss');
		dismiss.textContent = 'Dismiss';
		dismiss.setAttribute('title', 'Click here to dismiss.');
		dismiss.addEventListener('click', function(evt) {
			evt.preventDefault();
			evt.stopPropagation();
			dismissal();
		});

		this.container.appendChild(container);
		this.audio.play();

		//HTML5 notifications
		if ("Notification" in window) {
			function go() {
				if (Notification.permission === "granted") {
					new Notification(notification.title, { body: notification.body, icon: notification.icon });
				}
				else if (Notification.permission !== 'denied') {
					Notification.requestPermission(function (permission) {
						if(!('permission' in Notification))
							Notification.permission = permission;
						go()
					});
				}
			}
			go();
		}
	}

	return NotificationCenter;
})