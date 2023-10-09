// GlobalCache iTach IP2CC

const { InstanceBase, InstanceStatus, runEntrypoint } = require('@companion-module/base')
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
		this.pollTimer = undefined

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
}

runEntrypoint(itac_cc, UpgradeScripts)