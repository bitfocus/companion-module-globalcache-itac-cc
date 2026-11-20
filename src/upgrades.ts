import type {
	CompanionStaticUpgradeProps,
	CompanionStaticUpgradeResult,
	CompanionStaticUpgradeScript,
	CompanionUpgradeContext,
} from '@companion-module/base'
import type { ModuleConfig } from './config.js'

type Context = CompanionUpgradeContext<ModuleConfig>
type Props = CompanionStaticUpgradeProps<ModuleConfig, undefined>
type Result = CompanionStaticUpgradeResult<ModuleConfig, undefined>

/** Placeholder from the original module; upgrade scripts are tracked by index so it must stay. */
function v2_0_noop(): Result {
	return { updatedConfig: null, updatedActions: [], updatedFeedbacks: [] }
}

/** The relays are now read from the device, replacing the "Number of Ports" setting */
function v3_0_removePortsConfig(_context: Context, { config }: Props): Result {
	if (!config || !('ports' in config)) return { updatedConfig: null, updatedActions: [], updatedFeedbacks: [] }

	const { ports: _ports, ...updatedConfig } = config as ModuleConfig & { ports?: unknown }
	return { updatedConfig, updatedActions: [], updatedFeedbacks: [] }
}

/** The "Set Relay State" action gained a pulse duration; existing actions keep latching */
function v3_0_addPulseDuration(_context: Context, { actions }: Props): Result {
	const updatedActions = actions.filter((action) => action.actionId === 'portSet' && !action.options.duration)
	for (const action of updatedActions) {
		action.options.duration = { isExpression: false, value: 0 }
	}
	return { updatedConfig: null, updatedActions, updatedFeedbacks: [] }
}

export const UpgradeScripts: CompanionStaticUpgradeScript<ModuleConfig>[] = [
	v2_0_noop,
	v3_0_removePortsConfig,
	v3_0_addPulseDuration,
]
