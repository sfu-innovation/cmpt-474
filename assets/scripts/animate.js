define(function() {
	
	var running = {}, counter = 1, millisecondsPerSecond = 1000, desiredFrames = 60;

	return {
	/**
		 * Stops the given animation.
		 *
		 * @param id {Integer} Unique animation ID
		 * @return {Boolean} Whether the animation was stopped (aka, was running before)
		 */
		stop: function(id) {
			var cleared = running[id] != null;
			if (cleared) {
				running[id] = null;
			}

			return cleared;
		},


		/**
		 * Whether the given animation is still running.
		 *
		 * @param id {Integer} Unique animation ID
		 * @return {Boolean} Whether the animation is still running
		 */
		isRunning: function(id) {
			return running[id] != null;
		},


		/**
		 * Start the animation.
		 *
		 * @param stepCallback {Function} Pointer to function which is executed on every step.
		 *   Signature of the method should be `function(percent, now, virtual) { return continueWithAnimation; }`
		 * @param verifyCallback {Function} Executed before every animation step.
		 *   Signature of the method should be `function() { return continueWithAnimation; }`
		 * @param completedCallback {Function}
		 *   Signature of the method should be `function(droppedFrames, finishedAnimation) {}`
		 * @param duration {Integer} Milliseconds to run the animation
		 * @param easingMethod {Function} Pointer to easing function
		 *   Signature of the method should be `function(percent) { return modifiedValue; }`
		 * @param root {Element ? document.body} Render root, when available. Used for internal
		 *   usage of requestAnimationFrame.
		 * @return {Integer} Identifier of animation. Can be used to stop it any time.
		 */
		start: function(stepCallback, verifyCallback, completedCallback, duration, easingMethod, root) {

			var start = Date.now();
			var lastFrame = start;
			var percent = 0;
			var dropCounter = 0;
			var id = counter++;

			if (!root) {
				root = document.body;
			}

			// Compacting running db automatically every few new animations
			if (id % 20 === 0) {
				var newRunning = {};
				for (var usedId in running) {
					newRunning[usedId] = true;
				}
				running = newRunning;
			}

			// This is the internal step method which is called every few milliseconds
			var step = function(virtual) {

				// Normalize virtual value
				var render = virtual !== true;

				// Get current time
				var now = Date.now();

				// Verification is executed before next animation step
				if (!running[id] || (verifyCallback && !verifyCallback(id))) {

					running[id] = null;
					completedCallback && completedCallback(desiredFrames - (dropCounter / ((now - start) / millisecondsPerSecond)), id, false);
					return;

				}

				// For the current rendering to apply let's update omitted steps in memory.
				// This is important to bring internal state variables up-to-date with progress in time.
				if (render) {

					var droppedFrames = Math.round((now - lastFrame) / (millisecondsPerSecond / desiredFrames)) - 1;
					for (var j = 0; j < Math.min(droppedFrames, 4); j++) {
						step(true);
						dropCounter++;
					}

				}

				// Compute percent value
				if (duration) {
					percent = (now - start) / duration;
					if (percent > 1) {
						percent = 1;
					}
				}

				// Execute step callback, then...
				var value = easingMethod ? easingMethod(percent) : percent;
				if ((stepCallback(value, now, render) === false || percent === 1) && render) {
					running[id] = null;
					completedCallback && completedCallback(desiredFrames - (dropCounter / ((now - start) / millisecondsPerSecond)), id, percent === 1 || duration == null);
				} else if (render) {
					lastFrame = now;
					requestAnimationFrame(step);
				}
			};

			// Mark as running
			running[id] = true;

			// Init first step
			requestAnimationFrame(step, root);

			// Return unique animation ID
			return id;
		}
	};
})