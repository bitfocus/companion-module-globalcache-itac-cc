import type ModuleInstance from './main.js'

export type FeedbacksSchema = {
	relaystate: {
		type: 'boolean'
		options: {
			portNum: string
			state: string
		}
	}
}

export function UpdateFeedbacks(self: ModuleInstance): void {
	self.setFeedbackDefinitions({
		relaystate: {
			type: 'boolean',
			name: 'Relay State',
			description: 'Relay is in the selected state',
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
					label: 'On (Close) or Off (Open)',
					id: 'state',
					default: '1',
					choices: [
						{ id: '1', label: 'On (Close)' },
						{ id: '0', label: 'Off (Open)' },
					],
					disableAutoExpression: true,
				},
			],
			defaultStyle: {
				color: 0x000000,
				bgcolor: 0xff0000,
			},
			callback: ({ options }) => self.relayState(options.portNum) === options.state,
		},
	})
}
