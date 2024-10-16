import { expect } from 'chai';

import {
  controlledProxy,
  controlProp,
  disabledMemberHandlerProp,
} from './controlledProxy';

const sym = Symbol('sym');

interface TargetType extends Record<string | number | symbol, unknown> {
  foo: (value: string) => string;
  bar: (value: string) => string;
  answer: number | undefined;
  status: string;
  increment: () => number | undefined;
  [sym]: string; // Add the symbol key here
}

let target: TargetType;

describe('controlledProxy', function () {
  beforeEach(function () {
    target = {
      foo: (value: string) => `foo: ${value}`,
      bar: (value: string) => `bar: ${value}`,
      answer: 42,
      status: 'active',
      increment: function () {
        if (this.answer !== undefined) {
          this.answer += 1;
          return this.answer;
        }
        return undefined;
      },
      [sym]: 'initial value', // Initialize the symbol property
    };
  });

  it('should pass through uncontrolled members', function () {
    const proxy = controlledProxy({ defaultControls: {}, target });

    expect(proxy.foo('hello')).to.equal('foo: hello');
    expect(proxy.bar('world')).to.equal('bar: world');
    expect(proxy.answer).to.equal(42);
  });

  it('should control controlled members', function () {
    const proxy = controlledProxy({
      defaultControls: { foo: true, bar: false },
      target,
    });

    expect(proxy.foo('hello')).to.equal('foo: hello');
    expect(proxy.bar('world')).to.be.undefined;
    expect(proxy.answer).to.equal(42);
  });

  it('should apply default handler', function () {
    const proxy = controlledProxy({
      defaultControls: { foo: true, bar: false },
      defaultDisabledMemberHandler: () => 'default',
      target,
    });

    expect(proxy.foo('hello')).to.equal('foo: hello');
    expect(proxy.bar('world')).to.equal('default');
    expect(proxy.answer).to.equal(42);
  });

  it('should catch invalid control', function () {
    controlledProxy({
      defaultControls: { foo: true, bar: false, invalid: true },
      defaultDisabledMemberHandler: () => 'default',
      // @ts-expect-error Property 'invalid' is missing in type
      target,
    });
  });

  it('should control non-function properties', function () {
    const proxy = controlledProxy({
      defaultControls: { answer: false },
      target,
    });

    expect(proxy.answer).to.be.undefined;
    expect(proxy.status).to.equal('active');
  });

  it('should allow access to enabled non-function properties', function () {
    const proxy = controlledProxy({
      defaultControls: { answer: true },
      target,
    });

    expect(proxy.answer).to.equal(42);
  });

  it('should prevent assignment to disabled properties', function () {
    const proxy = controlledProxy({
      defaultControls: { answer: false },
      target,
    });

    expect(() => {
      proxy.answer = 100;
    }).to.throw(TypeError);

    expect(proxy.answer).to.be.undefined;
    expect(target.answer).to.equal(42);
  });

  it('should allow assignment to enabled properties', function () {
    const proxy = controlledProxy({
      defaultControls: { answer: true },
      target,
    });

    proxy.answer = 100;
    expect(proxy.answer).to.equal(100);
    expect(target.answer).to.equal(100);
  });

  it('should handle defaultHandler for properties', function () {
    const proxy = controlledProxy({
      defaultControls: { answer: false },
      defaultDisabledMemberHandler: () => 'default value',
      target,
    });

    expect(proxy.answer).to.equal('default value');
  });

  it('should maintain correct this context for methods', function () {
    const proxy = controlledProxy({
      defaultControls: { increment: true },
      target,
    });

    const result = proxy.increment();
    expect(result).to.equal(43);
    expect(proxy.answer).to.equal(43);
    expect(target.answer).to.equal(43);
  });

  it('should not execute disabled methods', function () {
    const proxy = controlledProxy({
      defaultControls: { increment: false },
      target,
    });

    const result = proxy.increment();
    expect(result).to.be.undefined;
    expect(proxy.answer).to.equal(42);
    expect(target.answer).to.equal(42);
  });

  it('should apply default handler for disabled methods', function () {
    const proxy = controlledProxy({
      defaultControls: { increment: false },
      defaultDisabledMemberHandler: () => 'default increment',
      target,
    });

    const result = proxy.increment();
    expect(result).to.equal('default increment');
    expect(proxy.answer).to.equal(42);
    expect(target.answer).to.equal(42);
  });

  it('should handle empty defaultControls (no properties controlled)', function () {
    const proxy = controlledProxy({
      defaultControls: {},
      target,
    });

    expect(proxy.foo('test')).to.equal('foo: test');
    expect(proxy.bar('test')).to.equal('bar: test');
    expect(proxy.answer).to.equal(42);
    expect(proxy.status).to.equal('active');
  });

  it('should handle all properties controlled and disabled', function () {
    const defaultControls = {
      foo: false,
      bar: false,
      answer: false,
      status: false,
      increment: false,
    };
    const proxy = controlledProxy({
      defaultControls,
      target,
    });

    expect(proxy.foo('test')).to.be.undefined;
    expect(proxy.bar('test')).to.be.undefined;
    expect(proxy.answer).to.be.undefined;
    expect(proxy.status).to.be.undefined;
    expect(proxy.increment()).to.be.undefined;
  });

  it('should handle property deletion through proxy', function () {
    const proxy = controlledProxy({
      defaultControls: { answer: true },
      target,
    });

    delete proxy.answer;

    expect(proxy.answer).to.be.undefined;
    expect(target.answer).to.be.undefined;
  });

  it('should expose defaultControls property', function () {
    const proxy = controlledProxy({
      defaultControls: { foo: true, bar: false },
      target,
    });

    expect(proxy[controlProp]).to.deep.equal({ foo: true, bar: false });
  });

  it('should allow adding new properties to defaultControls', function () {
    const proxy = controlledProxy({
      defaultControls: { foo: true },
      target,
    });

    // @ts-expect-error Property 'bar' does not exist on type 'Record<"foo", boolean>'.
    proxy[controlProp].bar = false;

    expect(proxy.bar('test')).to.be.undefined;
  });

  it('should allow updating control values', function () {
    const proxy = controlledProxy({
      defaultControls: { foo: true },
      target,
    });

    expect(proxy.foo('test')).to.equal('foo: test');

    proxy[controlProp].foo = false;
    expect(proxy.foo('test')).to.be.undefined;
  });

  it('should handle symbols as property keys', function () {
    target[sym] = 'symbol value';

    const proxy = controlledProxy({
      defaultControls: { [sym]: false },
      target,
    });

    expect(proxy[sym]).to.be.undefined;

    proxy[controlProp][sym] = true;
    expect(proxy[sym]).to.equal('symbol value');
  });

  it('should allow setting uncontrolled properties', function () {
    const proxy = controlledProxy({
      defaultControls: {},
      target,
    });

    proxy.newProp = 'new value';
    expect(proxy.newProp).to.equal('new value');
    expect(target.newProp).to.equal('new value');
  });

  it('should prevent setting controlled properties when disabled', function () {
    const proxy = controlledProxy({
      defaultControls: { status: false },
      target,
    });

    expect(() => {
      proxy.status = 'inactive';
    }).to.throw(TypeError);

    expect(proxy.status).to.be.undefined;
    expect(target.status).to.equal('active');
  });

  it('should allow setting controlled properties when enabled', function () {
    const proxy = controlledProxy({
      defaultControls: { status: true },
      target,
    });

    proxy.status = 'inactive';
    expect(proxy.status).to.equal('inactive');
    expect(target.status).to.equal('inactive');
  });

  it('should allow method calls with multiple arguments', function () {
    target.concat = (a: string, b: string) => a + b;

    const proxy = controlledProxy({
      defaultControls: { concat: true },
      target: target as typeof target & {
        concat: (a: string, b: string) => string;
      },
    });

    expect(proxy.concat('Hello, ', 'World!')).to.equal('Hello, World!');
  });

  it('should pass arguments to defaultHandler when method is disabled', function () {
    const proxy = controlledProxy({
      defaultControls: { foo: false },
      defaultDisabledMemberHandler: (
        target,
        prop,
        receiver,
        ...args: unknown[]
      ) => `default: ${args.join(', ')}`,
      target,
    });

    expect(proxy.foo('test')).to.equal('default: test');
  });

  it('should allow update to disabled member handler', function () {
    const proxy = controlledProxy({
      defaultControls: { foo: false },
      target,
    });

    proxy[disabledMemberHandlerProp] = () => 'new handler';

    expect(proxy.foo('test')).to.equal('new handler');
  });

  it('should fail when updating disabled member handler to non-function', function () {
    const proxy = controlledProxy({
      defaultControls: { foo: false },
      target,
    });

    expect(() => {
      // @ts-expect-error Type 'number' is not assignable to type 'DisabledMemberHandler<"foo", TargetType>'.
      proxy[disabledMemberHandlerProp] = 42;
    }).to.throw('The disabled member handler must be a function.');
  });
});
