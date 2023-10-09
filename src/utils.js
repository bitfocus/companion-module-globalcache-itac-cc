const { InstanceStatus, TCPHelper } = require('@companion-module/base')

module.exports = {
	initTCP() {
		let self = this;

		if (self.socket !== undefined) {
			self.socket.destroy();
			delete self.socket;
		}
	
		if (self.config.host) {
			self.socket = new TCPHelper(this.config.host, 4998);

			self.socket.on('connect', () => {
				self.updateStatus(InstanceStatus.Ok);
				self.log('debug', 'Connected');
				self.startPolling();
			});

			self.socket.on('data', (data) => {
				self.log('debug', 'Received: ' + data);
				let lines = data.toString().split('\r\n');
				for (let i = 0; i < lines.length; i++) {
					let line = lines[i];
					let matches = line.match(/state,(\d+):(\d+),(\d+)/);
					if (matches) {
						let port = matches[2];
						let state = matches[3];
						self.updatePortState(port, state);
					}
				}
			});
	
			self.socket.on('error', function (err) {
				self.log('error',"Network error: " + err.message);
				clearInterval(self.pollTimer);
			});
		}
	},

	startPolling() {
		let self = this;
		if (self.config.poll_interval > 0) {
			self.pollTimer = setInterval(() => {
				self.getStates();
			}, self.config.poll_interval);
		}
	},

	getStates() {
		let self = this;
		for (let i = 1; i <= self.config.ports; i++) {
			let cmd = `getstate,1:${i}`;
			self.sendCommand(cmd);
		}
	},

	updatePortState(port, state) {
		let self = this;

		for (let i = 0; i < self.DATA.length; i++) {
			let portObj = self.DATA[i];
			if (self.DATA[i].port == port) {
				self.DATA[i].state = state;
				self.checkFeedbacks('relaystate');
				self.checkVariables();
				break;
			}
		}
	},

	sendCommand(cmd) {
		let self = this;

		if (cmd !== undefined) {
			if (self.socket !== undefined && self.socket.isConnected) {
				self.log('debug', 'Sending: ' + cmd);
				self.socket.send(cmd + '\r\n')
				.then((result) => {
					//console.log('send result: ' + result);
				})
				.catch((error) => {
					//console.log('send error: ' + error);
				});
			} else {
				self.log('error', 'Network error: Connection to Device not opened.')
				clearInterval(self.pollTimer);
			}
		}
	}
}