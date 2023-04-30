const { combineRgb } = require('@companion-module/base')

module.exports = {
	initFeedbacks() {
		let feedbacks = {}

		feedbacks['relaystate'] = {
			type: 'boolean',
			name: 'Relay is in X State',
			description: 'Show feedback for Relay State',
			options: [
				{
					type: 'dropdown',
					label: 'Choose Port',
					id: 'portNum',
					default: this.CHOICES_PORTS[0].id,
					choices: this.CHOICES_PORTS
				},
				{
					type: 'dropdown',
					label: 'On (Close) or Off (Open)',
					id: 'state',
					default: '1',
					choices: [
						{ id: '1', label: 'On (Close)' },
						{ id: '0', label: 'Off (Open)' }
					]
				}
			],
			defaultStyle: {
				color: combineRgb(0, 0, 0),
				bgcolor: combineRgb(255, 0, 0)
			},
			callback: (event) => {
				let opt = event.options

				let portObj = this.DATA.find((PORT) => PORT.port == opt.portNum);

				if (portObj) {
					if (portObj.state == opt.state) {
						return true;
					}
				}
				
				return false
			},
		}
		
		this.setFeedbackDefinitions(feedbacks)
	}
}