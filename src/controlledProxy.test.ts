import { expect } from 'chai';

import { controlledProxy } from './controlledProxy';

const sym = Symbol('symProp');

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
    const proxy = controlledProxy({ controls: {}, target });

    expect(proxy.foo('hello')).to.equal('foo: hello');
    expect(proxy.bar('world')).to.equal('bar: world');
    expect(proxy.answer).to.equal(42);
  });

  it('should control controlled members', function () {
    const proxy = controlledProxy({
      controls: { foo: true, bar: false },
      target,
    });

    expect(proxy.foo('hello')).to.equal('foo: hello');
    expect(proxy.bar('world')).to.be.undefined;
    expect(proxy.answer).to.equal(42);
  });

  it('should apply default handler', function () {
    const proxy = controlledProxy({
      controls: { foo: true, bar: false },
      defaultProxyFunction: () => 'default',
      target,
    });

    expect(proxy.foo('hello')).to.equal('foo: hello');
    expect(proxy.bar('world')).to.equal('default');
    expect(proxy.answer).to.equal(42);
  });

  it('should catch invalid control', function () {
    controlledProxy({
      controls: { foo: true, bar: false, invalid: true },
      defaultProxyFunction: () => 'default',
      // @ts-expect-error Property 'invalid' is missing in type
      target,
    });
  });

  it('should control non-function properties', function () {
    const proxy = controlledProxy({
      controls: { answer: false },
      target,
    });

    expect(proxy.answer).to.be.undefined;
    expect(proxy.status).to.equal('active');
  });

  it('should allow access to enabled non-function properties', function () {
    const proxy = controlledProxy({
      controls: { answer: true },
      target,
    });

    expect(proxy.answer).to.equal(42);
  });

  it('should prevent assignment to disabled properties', function () {
    const proxy = controlledProxy({
      controls: { answer: false },
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
      controls: { answer: true },
      target,
    });

    proxy.answer = 100;
    expect(proxy.answer).to.equal(100);
    expect(target.answer).to.equal(100);
  });

  it('should handle defaultProxyFunction for properties', function () {
    const proxy = controlledProxy({
      controls: { answer: false },
      defaultProxyFunction: () => 'default value',
      target,
    });

    expect(proxy.answer).to.equal('default value');
  });

  it('should maintain correct this context for methods', function () {
    const proxy = controlledProxy({
      controls: { increment: true },
      target,
    });

    const result = proxy.increment();
    expect(result).to.equal(43);
    expect(proxy.answer).to.equal(43);
    expect(target.answer).to.equal(43);
  });

  it('should not execute disabled methods', function () {
    const proxy = controlledProxy({
      controls: { increment: false },
      target,
    });

    const result = proxy.increment();
    expect(result).to.be.undefined;
    expect(proxy.answer).to.equal(42);
    expect(target.answer).to.equal(42);
  });

  it('should apply default handler for disabled methods', function () {
    const proxy = controlledProxy({
      controls: { increment: false },
      defaultProxyFunction: () => 'default increment',
      target,
    });

    const result = proxy.increment();
    expect(result).to.equal('default increment');
    expect(proxy.answer).to.equal(42);
    expect(target.answer).to.equal(42);
  });

  it('should handle empty controls (no properties controlled)', function () {
    const proxy = controlledProxy({
      controls: {},
      target,
    });

    expect(proxy.foo('test')).to.equal('foo: test');
    expect(proxy.bar('test')).to.equal('bar: test');
    expect(proxy.answer).to.equal(42);
    expect(proxy.status).to.equal('active');
  });

  it('should handle all properties controlled and disabled', function () {
    const controls = {
      foo: false,
      bar: false,
      answer: false,
      status: false,
      increment: false,
    };
    const proxy = controlledProxy({
      controls,
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
      controls: { answer: true },
      target,
    });

    delete proxy.answer;

    expect(proxy.answer).to.be.undefined;
    expect(target.answer).to.be.undefined;
  });

  it('should expose controls property', function () {
    const proxy = controlledProxy({
      controls: { foo: true, bar: false },
      target,
    });

    expect(proxy.controls).to.deep.equal({ foo: true, bar: false });
  });

  it('should prevent adding new properties to controls', function () {
    const proxy = controlledProxy({
      controls: { foo: true },
      target,
    });

    expect(() => {
      // @ts-expect-error Property 'bar' does not exist on type 'Record<"foo", boolean>'.
      proxy.controls.bar = false;
    }).to.throw(TypeError);
  });

  it('should allow updating control values', function () {
    const proxy = controlledProxy({
      controls: { foo: true },
      target,
    });

    expect(proxy.foo('test')).to.equal('foo: test');

    proxy.controls.foo = false;
    expect(proxy.foo('test')).to.be.undefined;
  });

  it('should handle symbols as property keys', function () {
    target[sym] = 'symbol value';

    const proxy = controlledProxy({
      controls: { [sym]: false },
      target,
    });

    expect(proxy[sym]).to.be.undefined;

    proxy.controls[sym] = true;
    expect(proxy[sym]).to.equal('symbol value');
  });

  it('should allow setting uncontrolled properties', function () {
    const proxy = controlledProxy({
      controls: {},
      target,
    });

    proxy.newProp = 'new value';
    expect(proxy.newProp).to.equal('new value');
    expect(target.newProp).to.equal('new value');
  });

  it('should prevent setting controlled properties when disabled', function () {
    const proxy = controlledProxy({
      controls: { status: false },
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
      controls: { status: true },
      target,
    });

    proxy.status = 'inactive';
    expect(proxy.status).to.equal('inactive');
    expect(target.status).to.equal('inactive');
  });

  it('should allow method calls with multiple arguments', function () {
    target.concat = (a: string, b: string) => a + b;

    const proxy = controlledProxy({
      controls: { concat: true },
      target: target as typeof target & {
        concat: (a: string, b: string) => string;
      },
    });

    expect(proxy.concat('Hello, ', 'World!')).to.equal('Hello, World!');
  });

  it('should pass arguments to defaultProxyFunction when method is disabled', function () {
    const proxy = controlledProxy({
      controls: { foo: false },
      defaultProxyFunction: (...args: unknown[]) =>
        `default: ${args.join(', ')}`,
      target,
    });

    expect(proxy.foo('test')).to.equal('default: test');
  });
});
