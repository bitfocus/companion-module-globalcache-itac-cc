# Changelog

All notable changes to this module are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.1] - 2026-11-20

### Fixed

- Debug logging no longer records every polled relay state, only a change.
- A connection failure is logged once, rather than on every reconnect attempt, until the connection succeeds or the error changes.

### Changed

- Updated development dependencies.

## [3.0.0] - 2026-11-19

Requires Companion 5.0 or later or Bitfocus Buttons 1.8 or later.

### Added

- Support for the GC-100. The relays are read from the device when it connects, so commands go to the right module (module 1 on an iTach IP2CC, module 3 on a GC-100-12).
- A Toggle option in the "Set Relay State" action (previously "Choose port and state"), which switches the relay to the opposite of its last known state.
- A pulse duration in the "Set Relay State" action, which switches the relay to the opposite state after the given time. If the connection drops during a pulse, the relay is switched back once it returns. Existing actions keep latching (duration 0).
- `port_N_status` variables, showing `Closed` or `Open`.
- A Toggle preset for each port, showing the port's status, and state feedback on all presets.
- Connection status reflects the TCP connection (connecting, connected, disconnected), and reports when the device has no relays.
- Device errors are logged with their meaning from the iTach API.

### Changed

- Rewritten in TypeScript on Companion module API 2.1, running on Node.js 26.
- Presets are grouped by port in a single "Ports" section.
- Variables are empty until the relay state has been read, and while disconnected, rather than showing `0`.
- Commands end with a carriage return only, as specified by the iTach API.
- The polling interval can be set to 0 to disable polling, as its label described.

### Removed

- The "Number of Ports" setting. The number of relays comes from the device; saved configurations are upgraded automatically.

### Fixed

- Polling stopping after a failed send, and a new poll timer being added on every reconnect.
- Replies split across network packets not being parsed.

## [2.0.5]

Last release of the JavaScript module.

[3.0.1]: https://github.com/bitfocus/companion-module-globalcache-itac-cc/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/bitfocus/companion-module-globalcache-itac-cc/compare/v2.0.5...v3.0.0
[2.0.5]: https://github.com/bitfocus/companion-module-globalcache-itac-cc/releases/tag/v2.0.5
