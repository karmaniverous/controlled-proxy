import { controlledProxy, controlProp } from '../src/controlledProxy';

// Create a class that accepts a proxied logger as a constructor argument.
class MyClass {
  // Proxied logger must be compatible with console.debug & console.info.
  constructor(private logger: Pick<Console, 'debug' | 'info'>) {}

  // Exercise the proxied logger.
  myMethod() {
    this.logger.debug('debug log');
    this.logger.info('info log');
  }
}

// Create a controlled console logger, with all messages enabled by default
// and a custom disabled member handler.
const controlledConsoleLogger = controlledProxy({
  defaultControls: { debug: false, info: true },
  defaultDisabledMemberHandler: (target: Console, prop: PropertyKey) =>
    target.log(`Accessed disabled member: ${prop.toString()}`),
  target: console,
});

// Instantiate the class with the controlled console logger.
const myConsoleInstance = new MyClass(controlledConsoleLogger);

// Disable console debug messages at runtime.
controlledConsoleLogger[controlProp].debug = false;

// Exercise the proxied console logger from within the class.
myConsoleInstance.myMethod();
// > Accessed disabled member: debug
// > info log

// Create an equivalent controlled winston logger, with all messages enabled by
// default and a custom disabled member handler.
import { createLogger, type Logger } from 'winston';

const controlledWinstonLogger = controlledProxy({
  defaultControls: { debug: true, info: true },
  defaultDisabledMemberHandler: (target: Logger, prop: PropertyKey) =>
    target.log('warn', `Accessed disabled member: ${prop.toString()}`),
  target: createLogger(),
});

// Instantiate the class again with the controlled winston logger.
const myWinstonInstance = new MyClass(controlledWinstonLogger);

// Disable winston debug messages at runtime.
controlledWinstonLogger[controlProp].debug = false;

// Exercise the proxied winston logger from the class.
myWinstonInstance.myMethod();
// > [winston] { "level":"warn", "message":"Accessed disabled member: debug" }
// > [winston] { "level":"info", "message":"info log" }
