
module.exports = {
	initVariables() {
		let variables = []
		
		this.setVariableDefinitions(variables)
	},

	checkVariables() {
		try {
			/*
			let variableObj = {};


			this.setVariableValues(variableObj);
			*/
		}
		catch(error) {
			this.log('error', `Error checking variables: ${error.toString()}`)
		}
	}
}