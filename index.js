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
		if (this.socket !== undefined) {
			this.socket.destroy();
			delete this.socket;
		}
	
		if (this.config.host) {
			this.socket = new TCPHelper(this.config.host, 4998);

			this.socket.on('connect', () => {
				this.updateStatus(InstanceStatus.Ok);
			});

			this.socket.on('data', (receivebuffer) => {
				//future feedbacks can be added here
			});
	
			this.socket.on('error', function (err) {
				this.log('error',"Network error: " + err.message);
			});
		}
	}

	sendCommand(cmd) {
		if (cmd !== undefined) {
			if (this.socket !== undefined && this.socket.isConnected) {
				this.socket.send(cmd + '\r\n')
				.then((result) => {
					//console.log('send result: ' + result);
				})
				.catch((error) => {
					//console.log('send error: ' + error);
				});
			} else {
				this.log('error', 'Network error: Connection to Device not opened.')
				clearInterval(this.pollTimer);
			}
		}
	}
}

runEntrypoint(itac_cc, UpgradeScripts)