module.exports = {
	initPresets() {
		let presets = []

		for (let i = 1; i <= this.config.ports; i++) {
			presets.push({
				type: 'button',
				category: `Port ${i}`,
				name: 'Close',
				style: {
					text: `PORT ${i}\\nCLOSE`,
					size: '14',
					color: '16777215',
					bgcolor: 0
				},
				steps: [
					{
						down: [
							{
								actionId: 'portSet',
								options: {
									portNum: i.toString(),
									setPort: '1'
								}
							}
						],
						up: [

						]
					}
				],
				feedbacks: []
			});

			presets.push({
				type: 'button',
				category: `Port ${i}`,
				name: 'Open',
				style: {
					text: `PORT ${i}\\nOPEN`,
					size: '14',
					color: '16777215',
					bgcolor: 0
				},
				steps: [
					{
						down: [
							{
								actionId: 'portSet',
								options: {
									portNum: i.toString(),
									setPort: '0'
								}
							}
						],
						up: [

						]
					}
				],
				feedbacks: []
			});
		}

		this.setPresetDefinitions(presets)
	}
}