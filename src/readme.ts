import {
  controlledProxy,
  controlProp,
  disabledMemberHandlerProp,
} from './controlledProxy';

const controlledConsole = controlledProxy({
  defaultControls: { debug: true, info: false },
  target: console,
});

// Info messages are disabled by default.
controlledConsole.debug('debug log'); // > debug log
controlledConsole.info('info log'); // >

// Disable debug messages & enable info messages.
controlledConsole[controlProp].debug = false;
controlledConsole[controlProp].info = true;

// Try again.
controlledConsole.debug('debug log'); // >
controlledConsole.info('info log'); // > info log

// Change the disabled member handler.
controlledConsole[disabledMemberHandlerProp] = (target, prop) =>
  target.log(`Accessed disabled member: ${prop.toString()}`);

// One more time.
controlledConsole.debug('debug log'); // > Accessed disabled member: debug
controlledConsole.info('info log'); // > info log
