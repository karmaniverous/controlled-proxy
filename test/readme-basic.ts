import { controlledProxy } from '../src/controlledProxy';

// Create a controlled console logger. Info messages are disabled by default.
const controlledConsoleLogger = controlledProxy({
  defaultControls: { debug: true, info: false },
  target: console,
});

// Log messages.
controlledConsoleLogger.debug('debug log');
controlledConsoleLogger.info('info log');
// > debug log
