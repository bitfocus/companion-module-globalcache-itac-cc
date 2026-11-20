import type {
	CompanionPresetDefinitions,
	CompanionPresetGroup,
	CompanionSimplePresetDefinition,
} from '@companion-module/base'
import type ModuleInstance from './main.js'
import type { ModuleSchema } from './main.js'

const WHITE = 0xffffff
const BLACK = 0x000000
const RED = 0xff0000
const GREEN = 0x00cc00

function relayPreset(
	port: string,
	name: string,
	text: string,
	setPort: string,
	feedbackState: string,
	feedbackColor: number,
): CompanionSimplePresetDefinition<ModuleSchema> {
	return {
		type: 'simple',
		name,
		style: { text: `PORT ${port}\\n${text}`, size: '14', color: WHITE, bgcolor: BLACK, show_topbar: false },
		steps: [{ down: [{ actionId: 'portSet', options: { portNum: port, setPort, duration: 0 } }], up: [] }],
		feedbacks: [
			{
				feedbackId: 'relaystate',
				options: { portNum: port, state: feedbackState },
				style: { bgcolor: feedbackColor },
			},
		],
	}
}

export function UpdatePresets(self: ModuleInstance): void {
	const groups: CompanionPresetGroup<ModuleSchema>[] = []
	const presets: CompanionPresetDefinitions<ModuleSchema> = {}

	for (const { id: port, label } of self.relayChoices) {
		// Companion replaces the variable prefix with the connection's label when the preset is used
		presets[`${port}toggle`] = relayPreset(
			port,
			'Toggle',
			`$(globalcache-itac-cc:port_${port}_status)`,
			'toggle',
			'1',
			RED,
		)
		presets[`${port}close`] = relayPreset(port, 'Close', 'CLOSE', '1', '1', RED)
		presets[`${port}open`] = relayPreset(port, 'Open', 'OPEN', '0', '0', GREEN)

		groups.push({
			id: `port${port}`,
			type: 'simple',
			name: label,
			presets: [`${port}toggle`, `${port}close`, `${port}open`],
		})
	}

	self.setPresetDefinitions([{ id: 'ports', name: 'Ports', definitions: groups }], presets)
}
