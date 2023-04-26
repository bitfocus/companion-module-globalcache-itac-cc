module.exports = {
	initActions() {
		let actions = {}

		actions.portSet = {
			name: 'Choose port and state',
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
					label: 'Set On or Off',
					id: 'setPort',
					default: '1',
					choices: [
						{ id: '1', label: 'Turn On (Close)' },
						{ id: '0', label: 'Turn Off (Open)' }
					]
				}
			],
			callback: async (event) => {
				let opt  = event.options;
				let cmd  = `setstate,1:${opt.portNum.replace(',', '')},${opt.setPort}}`;
				this.sendCommand(cmd);
			}
		}

		this.setActionDefinitions(actions)
	}
}