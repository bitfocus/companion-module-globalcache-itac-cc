import type ModuleInstance from './main.js'

export type VariablesSchema = {
	[id: `port_${number}_state`]: '0' | '1' | undefined
	[id: `port_${number}_status`]: 'Open' | 'Closed' | undefined
}

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	const variables: Record<keyof VariablesSchema, { name: string }> = {}
	for (const { id, label } of self.relayChoices) {
		variables[`port_${Number(id)}_state`] = { name: `${label} State (1 closed, 0 open)` }
		variables[`port_${Number(id)}_status`] = { name: `${label} Status (Closed/Open)` }
	}
	self.setVariableDefinitions(variables)
}

/** Values stay empty until the device has reported the relay's state */
export function UpdateVariableValues(self: ModuleInstance): void {
	const values: VariablesSchema = {}
	for (const { id } of self.relayChoices) {
		const state = self.relayState(id)
		values[`port_${Number(id)}_state`] = state === '1' || state === '0' ? state : undefined
		values[`port_${Number(id)}_status`] = state === undefined ? undefined : state === '1' ? 'Closed' : 'Open'
	}
	self.setVariableValues(values)
}
