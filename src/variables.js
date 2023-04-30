
module.exports = {
	initVariables() {
		let variables = []

		for (let i = 0; i < this.config.ports; i++) {
			variables.push({
				label: `Port ${i + 1} State`,
				name: `port_${i + 1}_state`
			})
		}
		
		this.setVariableDefinitions(variables)
	},

	checkVariables() {
		try {
			let variableObj = {};

			for (let i = 0; i < this.config.ports; i++) {
				let port = i + 1;
				let portObj = this.DATA.find((PORT) => PORT.port == port);
				if (portObj) {
					variableObj[`port_${port}_state`] = portObj.state;
				}
			}

			this.setVariableValues(variableObj);
		}
		catch(error) {
			this.log('error', `Error checking variables: ${error.toString()}`)
		}
	}
}