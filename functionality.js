		var heartbeats;
		var ws;

		var load = function () {
			heartbeats = {};

			ws = new WebSocket('wss://' + location.host + '/OperatorControl/endpoint');
			ws.onmessage = onmessage;
			ws.onopen = function (event) {
				send(new Message("load"));
			};
			ws.onerror = onerror;

			var inputs = document.getElementsByTagName('input');
			for (var i = 0; i < inputs.length; i++) {
				if (inputs[i].type == 'checkbox') {
					inputs[i].addEventListener("change", function () {
						sendChange(this);
					});
				}
			}

			window.setInterval(checkHeartbeats, 500);
		}
		window.addEventListener("load", load);

		var onmessage = function (message) {
			console.log(message.data);
			var msg = JSON.parse(message.data);

			for (var id in msg) {
				var value = msg[id]['value'];

				if (id.substring(0, 5) == 'heart') {
					if (heartbeats[id] === undefined) heartbeats[id] = new Heartbeat(value);
					heartbeats[id].last = value;
					document.getElementById(id).value = heartbeats[id].adjusted().toLocaleTimeString();

				} else if (id.substring(0, 4) == 'temp') {
					var display = '?';
					//if (value !== null) display = convertToF(value).toFixed() + " °F";
					if (value !== null) display = value + " °C";
					document.getElementById(id).value = display;

					var status = msg[id]['status'];
					if (status !== null) document.getElementById(id).className = status;

				} else if (id.substring(0, 8) == 'pressure') {
					var display = '?';
					if (value !== null) display = value + " PSI";
					document.getElementById(id).value = display;

				} else if (id.substring(0, 5) == 'relay') {
					if (value == true) {
						document.getElementById(id).checked = true;
					} else {
						document.getElementById(id).checked = false;
					}

				} else if (id.substring(0, 9) == 'indicator') {
					if (value == true) {
						document.getElementById(id).className = 'on';
					} else {
						document.getElementById(id).className = '';
					}

				} else if (id.substring(0, 6) == 'option') {
					if (value == true) {
						document.getElementById(id).checked = true;
					} else {
						document.getElementById(id).checked = false;
					}

				} else if (id.substring(0, 3) == 'co2') {
					var display = 'CO2 ?ppm';
					if (value !== null) {
						display = "CO2 " + value + "ppm";
					} else {
						display = 'CO2 ?ppm';
					}
					document.getElementById(id).childNodes[1].nodeValue = display;

					if (value > 2000) {
						document.getElementById(id).className = 'on';
					} else {
						document.getElementById(id).className = '';
					}

				} // if (id.substring)
			} // for (var id in msg)
		};

		function convertToF(celsius) {
			var parsed = parseFloat(celsius);
			var converted = (parsed * (9 / 5)) + 32;
			return converted;
		}

		var onerror = function (event) {
			console.log("socket error: " + event);
		}

		function Heartbeat(initial) {
			this.reference = new Date();
			this.initial = initial;
			this.last = initial;
			this.adjusted = function () {
				var relative = this.last - this.initial;
				return new Date(this.reference.getTime() + relative);
			}
		}

		function checkHeartbeats() {
			for (id in heartbeats) {
				var now = new Date();
				var seconds = (now.getTime() - heartbeats[id].adjusted().getTime()) / 1000;

				if (seconds > 10) {
					window.location.reload(true);

				} else if (seconds > 5) {
					document.getElementById(id).className = 'error';

				} else if (seconds > 3) {
					document.getElementById(id).className = 'warn';

				} else {
					document.getElementById(id).className = '';

				}
			}
		}

		function Message(type) {
			this.type = type;
		}

		function sendChange(element) {
			var message = new Message("change");
			message.id = element.id;
			message.value = element.checked;
			element.checked = !element.checked
			send(message);
		}

		function send(message) {
			var json = JSON.stringify(message);
			console.log("sending " + json);
			ws.send(json);
		}

		function displayChamber(evt, cityName) {
			var i, tabcontent, tablinks;
			tabcontent = document.getElementsByClassName("tabcontent");
			for (i = 0; i < tabcontent.length; i++) {
				tabcontent[i].style.display = "none";
			}
			tablinks = document.getElementsByClassName("tablinks");
			for (i = 0; i < tablinks.length; i++) {
				tablinks[i].className = tablinks[i].className.replace(" active", "");
			}
			document.getElementById(cityName).style.display = "block";
			evt.currentTarget.className += " active";
		}
