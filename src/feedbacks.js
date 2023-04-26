const { combineRgb } = require('@companion-module/base')

module.exports = {
	initFeedbacks() {
		let feedbacks = {}
		
		this.setFeedbackDefinitions(feedbacks)
	}
}