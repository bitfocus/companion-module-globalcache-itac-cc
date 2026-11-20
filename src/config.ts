import { Regex, type SomeCompanionConfigField } from '@companion-module/base'

export type ModuleConfig = {
	host: string
	poll_interval: number
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'static-text',
			id: 'info',
			width: 12,
			label: 'Information',
			value:
				'This module controls the relays of a <a href="https://www.globalcache.com/products/itach/ip2ccspecs/" target="_new">Global Cache</a> iTach IP2CC or GC-100. The relays are detected from the device when it connects.',
		},
		{
			type: 'textinput',
			label: 'Device IP',
			id: 'host',
			width: 6,
			default: '192.168.0.1',
			regex: Regex.IP,
		},
		{
			type: 'number',
			id: 'poll_interval',
			label: 'Polling Interval (ms), set to 0 to disable polling',
			min: 0,
			max: 30000,
			default: 1000,
			width: 3,
		},
	]
}
