const { Regex } = require('@companion-module/base')

module.exports = {
	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This module controls an itac IP2CC device by <a href="https://www.globalcache.com/products/itach/ip2ccspecs/" target="_new">Global Cache</a>.',
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Device IP',
				width: 6,
				default: '192.168.0.1',
				regex: Regex.IP,
			},
			{
				type: 'dropdown',
				id: 'ports',
				label: 'Number of Ports',
				width: 6,
				default: 3,
				choices: [
					{ id: 3, label: '3' },
					{ id: 6, label: '6' },
				]
			},
			{
				type: 'number',
				id: 'poll_interval',
				label: 'Polling Interval (ms), set to 0 to disable polling',
				min: 50,
				max: 30000,
				default: 1000,
				width: 3,
			}
		]
	}
}