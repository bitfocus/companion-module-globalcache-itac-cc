export type Relay = {
	/** 1-based relay number across all relay modules, used as the action/feedback/variable id */
	id: string
	/** `<module>:<connector>` as used in setstate/getstate */
	address: string
}

export type DeviceInfo = {
	relays: Relay[]
	/** iTach units report their network module as module 0; a GC-100 does not */
	isItach: boolean
}

/** Used until the device has answered `getdevices`: an iTach IP2CC, with 3 relays in module 1 */
export const DEFAULT_DEVICE: DeviceInfo = {
	relays: [1, 2, 3].map((n) => ({ id: `${n}`, address: `1:${n}` })),
	isItach: true,
}

const DEVICE_LINE_REGEX = /^device,(\d+),(\d+)\s+(\S+)/

/** Builds the relay list from the `device,<module>,<count> <TYPE>` lines of a `getdevices` reply */
export function parseDevices(lines: string[]): DeviceInfo {
	const relays: Relay[] = []
	let isItach = false

	for (const line of lines) {
		const match = DEVICE_LINE_REGEX.exec(line)
		if (!match) continue

		const [, module, count, type] = match
		if (module === '0' && (type === 'ETHERNET' || type === 'WIFI')) isItach = true
		if (type !== 'RELAY') continue

		for (let connector = 1; connector <= Number(count); connector++) {
			relays.push({ id: `${relays.length + 1}`, address: `${module}:${connector}` })
		}
	}

	return { relays, isItach }
}
