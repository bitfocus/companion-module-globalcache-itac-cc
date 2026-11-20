import type ModuleInstance from './main.js'

export type ActionsSchema = {
	portSet: {
		options: {
			portNum: string
			setPort: string
			duration: number
		}
	}
}

export function UpdateActions(self: ModuleInstance): void {
	self.setActionDefinitions({
		portSet: {
			name: 'Set Relay State',
			description: 'Set the state of the selected relay',
			options: [
				{
					type: 'dropdown',
					label: 'Choose Port',
					id: 'portNum',
					default: '1',
					choices: self.relayChoices,
					// Before the device has been asked for its relays, a saved port may not be listed yet
					allowInvalidValues: true,
				},
				{
					type: 'dropdown',
					label: 'Set On or Off',
					id: 'setPort',
					default: '1',
					choices: [
						{ id: '1', label: 'Turn On (Close)' },
						{ id: '0', label: 'Turn Off (Open)' },
						{ id: 'toggle', label: 'Toggle' },
					],
					disableAutoExpression: true,
				},
				{
					type: 'number',
					label: 'Pulse Duration (ms), 0 to latch',
					description: 'After this time the relay is switched back to the state it was in before',
					id: 'duration',
					default: 0,
					min: 0,
					max: 3600000,
					asInteger: true,
				},
			],
			callback: async ({ options }) => {
				self.setRelayState(options.portNum, options.setPort, options.duration)
			},
		},
	})
}
