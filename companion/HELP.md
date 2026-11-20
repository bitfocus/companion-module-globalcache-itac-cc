## GlobalCache iTach IP2CC / GC-100

This module controls the relays (contact closures) of a GlobalCache iTach IP2CC or GC-100.

### Configuration

- Type in the IP address of the device.
- The device will use port 4998 to communicate.
- Set the polling interval used to read the relay states (0 disables polling). The device does not report changes made by other controllers, so polling is needed to keep them in sync.

The relays are read from the device when it connects, so there is nothing to set up for them. They are numbered from 1 across all of the device's relay modules: on an IP2CC, ports 1–3 are connectors `1:1`–`1:3`; on a GC-100-12 they are `3:1`–`3:3`.

A GC-100 accepts only one connection on port 4998, so other software (such as iHelp) cannot connect while Companion is connected.

### Available Actions

- Set Relay State: Close, Open or Toggle, with an optional pulse duration that switches the relay to the opposite state after the given time. Toggle uses the last state read from the device.

### Available Feedbacks

- Relay State: the relay is in the selected state

### Available Variables

- `port_N_state`: `1` when the relay is closed, `0` when open
- `port_N_status`: `Closed` or `Open`

Both are empty until the state has been read from the device, and while disconnected.

### Presets

Each port has a Toggle button that shows its status, plus separate Close and Open buttons.
