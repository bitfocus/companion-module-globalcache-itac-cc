import { InstanceBase, InstanceStatus, TCPHelper, type SomeCompanionConfigField } from '@companion-module/base'
import { UpdateActions, type ActionsSchema } from './actions.js'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { DEFAULT_DEVICE, parseDevices, type DeviceInfo, type Relay } from './devices.js'
import { UpdateFeedbacks, type FeedbacksSchema } from './feedbacks.js'
import { UpdatePresets } from './presets.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateVariableDefinitions, UpdateVariableValues, type VariablesSchema } from './variables.js'

const DEVICE_PORT = 4998
// The iTach spec documents `state,1:N,S`, but iTach firmware echoes `setstate,1:N,S` to a setstate
const STATE_REGEX = /^(?:set)?state,(\d+:\d+),([01])/
// Errors arrive as `ERR_01`, `ERR_1:2,010` or `unknowncommand, 010` depending on the command
const ERROR_REGEX = /^(?:ERR_(?:\d+:\d+,)?|unknowncommand,\s*)(\d+)/
// From the iTach API; a GC-100 numbers its errors differently
const ITACH_ERROR_CODES: Record<number, string> = {
	1: 'Invalid command',
	2: 'Invalid module address',
	3: 'Invalid connector address',
	11: 'No carriage return found',
	15: 'No carriage return before buffer full',
	16: 'No carriage return',
	17: 'Bad command syntax',
	18: 'Sensor command sent to non-input connector',
	23: 'Unknown option',
	27: 'Settings are locked',
}

export type ModuleSchema = {
	config: ModuleConfig
	secrets: undefined
	actions: ActionsSchema
	feedbacks: FeedbacksSchema
	variables: VariablesSchema
}

export { UpgradeScripts }

export default class ModuleInstance extends InstanceBase<ModuleSchema> {
	config!: ModuleConfig
	device: DeviceInfo = DEFAULT_DEVICE

	/** Relay address → '1' (closed) / '0' (open), as reported by the device */
	readonly #states = new Map<string, string>()
	#socket: TCPHelper | undefined
	#pollTimer: NodeJS.Timeout | undefined
	readonly #pulseTimers = new Map<string, NodeJS.Timeout>()
	#receiveBuffer = ''
	/** Lines of a `getdevices` reply received so far, or undefined when not waiting for one */
	#deviceLines: string[] | undefined

	constructor(internal: unknown) {
		super(internal)
	}

	get relayChoices(): { id: string; label: string }[] {
		return this.device.relays.map(({ id }) => ({ id, label: `Port ${id}` }))
	}

	relayState(id: string): string | undefined {
		const relay = this.#findRelay(id)
		return relay && this.#states.get(relay.address)
	}

	async init(config: ModuleConfig): Promise<void> {
		this.#updateDefinitions()
		await this.configUpdated(config)
	}

	async destroy(): Promise<void> {
		this.#stopPolling()
		this.#clearPulseTimers()
		this.#socket?.destroy()
		this.#socket = undefined
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = config
		this.#initTCP()
		this.#startPolling()
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	/**
	 * `requested` is '1' (close), '0' (open) or 'toggle'.
	 * The iTach has no pulse command (it rejects a setstate period), so a pulse is the requested state
	 * followed by the opposite state once `pulseMs` has elapsed.
	 */
	setRelayState(id: string, requested: string, pulseMs: number): void {
		const relay = this.#findRelay(id)
		if (!relay) {
			this.log('warn', `Port ${id} does not exist on this device`)
			return
		}

		let state = requested
		if (requested === 'toggle') {
			const current = this.#states.get(relay.address)
			if (current === undefined) {
				this.log('warn', `Unable to toggle port ${id}, its state has not been read from the device yet`)
				return
			}
			state = current === '1' ? '0' : '1'
		}

		const pending = this.#pulseTimers.get(relay.address)
		if (pending) {
			clearTimeout(pending)
			this.#pulseTimers.delete(relay.address)
		}

		this.sendCommand(`setstate,${relay.address},${state}`)

		if (pulseMs > 0) {
			this.#pulseTimers.set(
				relay.address,
				setTimeout(() => {
					this.#pulseTimers.delete(relay.address)
					this.sendCommand(`setstate,${relay.address},${state === '1' ? '0' : '1'}`)
				}, pulseMs),
			)
		}
	}

	sendCommand(cmd: string): void {
		if (this.#socket?.isConnected) {
			this.log('debug', `Sending: ${cmd}`)
			this.#socket.send(`${cmd}\r`)
		} else {
			this.log('warn', `Not connected, unable to send: ${cmd}`)
		}
	}

	#findRelay(id: string): Relay | undefined {
		return this.device.relays.find((relay) => relay.id === id)
	}

	#updateDefinitions(): void {
		UpdateActions(this)
		UpdateFeedbacks(this)
		UpdateVariableDefinitions(this)
		UpdateVariableValues(this)
		UpdatePresets(this)
	}

	#clearPulseTimers(): void {
		for (const timer of this.#pulseTimers.values()) clearTimeout(timer)
		this.#pulseTimers.clear()
	}

	#initTCP(): void {
		this.#socket?.destroy()
		this.#socket = undefined
		this.#receiveBuffer = ''
		this.#deviceLines = undefined

		if (!this.config.host) {
			this.updateStatus(InstanceStatus.BadConfig, 'No device IP configured')
			return
		}

		this.updateStatus(InstanceStatus.Connecting)
		const socket = new TCPHelper(this.config.host, DEVICE_PORT)
		this.#socket = socket

		socket.on('status_change', (status, message) => {
			this.updateStatus(status, message)
			if (status !== InstanceStatus.Ok) this.#clearStates()
		})

		socket.on('connect', () => {
			this.log('debug', 'Connected')
			this.#receiveBuffer = ''
			this.#deviceLines = []
			this.sendCommand('getdevices')
		})

		socket.on('data', (data) => {
			this.#receiveBuffer += data.toString()
			const lines = this.#receiveBuffer.split(/\r\n?|\n/)
			// The last element is an incomplete line (or empty), keep it for the next chunk
			this.#receiveBuffer = lines.pop() ?? ''
			for (const line of lines) {
				if (line) this.#handleLine(line)
			}
		})

		socket.on('error', (err) => {
			this.log('error', `Network error: ${err.message}`)
		})
	}

	#handleLine(line: string): void {
		this.log('debug', `Received: ${line}`)

		if (this.#deviceLines) {
			if (line === 'endlistdevices') {
				this.#applyDevices(parseDevices(this.#deviceLines))
				this.#deviceLines = undefined
				return
			}
			if (line.startsWith('device,')) {
				this.#deviceLines.push(line)
				return
			}
		}

		const state = STATE_REGEX.exec(line)
		if (state) {
			this.#storeState(state[1], state[2])
			return
		}

		const error = ERROR_REGEX.exec(line)
		if (error) {
			const code = Number(error[1])
			const meaning = (this.device.isItach && ITACH_ERROR_CODES[code]) || 'Unknown error'
			this.log('warn', `Device error ${code}: ${meaning} (${line})`)
		}
	}

	#applyDevices(device: DeviceInfo): void {
		if (device.relays.length === 0) {
			this.updateStatus(InstanceStatus.BadConfig, 'The device has no relay modules')
		}

		const changed = JSON.stringify(device.relays) !== JSON.stringify(this.device.relays)
		this.device = device
		if (changed) {
			this.log('info', `Found ${device.relays.length} relays: ${device.relays.map((r) => r.address).join(', ')}`)
			this.#clearPulseTimers()
			this.#clearStates()
			this.#updateDefinitions()
		}

		this.#requestStates()
	}

	/** The states are unknown while disconnected, so feedbacks and variables show nothing rather than stale values */
	#clearStates(): void {
		if (this.#states.size === 0) return
		this.#states.clear()
		this.checkFeedbacks('relaystate')
		UpdateVariableValues(this)
	}

	#storeState(address: string, state: string): void {
		if (this.#states.get(address) === state) return

		this.#states.set(address, state)
		this.checkFeedbacks('relaystate')
		UpdateVariableValues(this)
	}

	#requestStates(): void {
		for (const { address } of this.device.relays) {
			this.#socket?.send(`getstate,${address}\r`)
		}
	}

	#startPolling(): void {
		this.#stopPolling()
		if (this.config.poll_interval > 0) {
			this.#pollTimer = setInterval(() => {
				// Wait for getdevices, so a GC-100 isn't polled at the default iTach addresses
				if (this.#socket?.isConnected && !this.#deviceLines) this.#requestStates()
			}, this.config.poll_interval)
		}
	}

	#stopPolling(): void {
		if (this.#pollTimer !== undefined) {
			clearInterval(this.#pollTimer)
			this.#pollTimer = undefined
		}
	}
}
