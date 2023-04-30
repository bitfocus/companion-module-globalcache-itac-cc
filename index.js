// GlobalCache iTach IP2CC

const { InstanceBase, InstanceStatus, Regex, runEntrypoint, TCPHelper } = require('@companion-module/base')
const UpgradeScripts = require('./src/upgrades')

const config = require('./src/config')
const actions = require('./src/actions')
const feedbacks = require('./src/feedbacks')
const variables = require('./src/variables')
const presets = require('./src/presets')

const utils = require('./src/utils')

class itac_cc extends InstanceBase {
	constructor(internal) {
		super(internal)

		// Assign the methods from the listed files to this class
		Object.assign(this, {
			...config,
			...actions,
			...feedbacks,
			...variables,
			...presets,
			...utils
		})

		this.socket = undefined

		this.CHOICES_PORTS = [
			{ id: '1', label: 'Port 1' },
			{ id: '2', label: 'Port 2' },
			{ id: '3', label: 'Port 3' },
			{ id: '4', label: 'Port 4' },
			{ id: '5', label: 'Port 5' },
			{ id: '6', label: 'Port 6' },
		];

		this.DATA = [
			{ port: '1', state: '0' },
			{ port: '2', state: '0' },
			{ port: '3', state: '0' },
			{ port: '4', state: '0' },
			{ port: '5', state: '0' },
			{ port: '6', state: '0' },
		]
	}

	async destroy() {
		if (this.socket !== undefined) {
			this.socket.destroy()
		}

		if (this.pollTimer !== undefined) {
			clearInterval(this.pollTimer)
			delete this.pollTimer
		}
	}

	async init(config) {
		this.updateStatus(InstanceStatus.Connecting)
		this.configUpdated(config)
	}

	async configUpdated(config) {
		// polling is running and polling has been de-selected by config change
		if (this.pollTimer !== undefined) {
			clearInterval(this.pollTimer)
			delete this.pollTimer
		}
		this.config = config

		this.CHOICES_PORTS = [];
		for (let i = 1; i <= this.config.ports; i++) {
			this.CHOICES_PORTS.push({ id: i.toString(), label: `Port ${i.toString()}` })
		}
		
		this.initActions()
		this.initFeedbacks()
		this.initVariables()
		this.initPresets()

		this.initTCP()
	}

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
	}

	startPolling() {
		let self = this;
		if (self.config.poll_interval > 0) {
			self.pollTimer = setInterval(() => {
				self.getStates();
			}, self.config.poll_interval);
		}
	}

	getStates() {
		let self = this;
		for (let i = 1; i <= self.config.ports; i++) {
			let cmd = `getstate,1:${i}`;
			self.sendCommand(cmd);
		}
	}

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
	}

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

runEntrypoint(itac_cc, UpgradeScripts)