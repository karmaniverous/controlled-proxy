import {
  controlledProxy,
  controlProp,
  disabledMemberHandlerProp,
} from '../src/controlledProxy';

// Create a controlled console logger. Info messages are disabled by default.
const controlledConsoleLogger = controlledProxy({
  defaultControls: { debug: true, info: false },
  target: console,
});

// Disable debug messages & enable info messages at runtime.
controlledConsoleLogger[controlProp].debug = false;
controlledConsoleLogger[controlProp].info = true;

// Log messages.
controlledConsoleLogger.debug('debug log');
controlledConsoleLogger.info('info log');
// > info log

// Change the disabled member handler.
controlledConsoleLogger[disabledMemberHandlerProp] = (
  target: Console,
  prop: PropertyKey,
) => target.log(`Accessed disabled member: ${prop.toString()}`);

// Log messages again.
controlledConsoleLogger.debug('debug log');
controlledConsoleLogger.info('info log');
// > Accessed disabled member: debug
// > info log
