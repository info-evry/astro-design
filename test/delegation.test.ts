/**
 * Delegation Script Tests
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { bindDelegation } from '../src/scripts/delegation';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

let unbind: (() => void) | undefined;

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  unbind?.();
  unbind = undefined;
});

function click(el: Element): MouseEvent {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true });
  el.dispatchEvent(event);
  return event;
}

function change(el: Element): void {
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('click delegation', () => {
  test('calls the handler with (el, event), also for nested targets', () => {
    document.body.innerHTML = '<button data-action="go"><span id="inner">x</span></button>';
    const go = vi.fn();
    unbind = bindDelegation({ go }, {});

    const event = click(document.getElementById('inner')!);

    expect(go).toHaveBeenCalledTimes(1);
    expect(go.mock.calls[0][0]).toBe(document.querySelector('button'));
    expect(go.mock.calls[0][1]).toBe(event);
  });

  test('innermost data-action wins', () => {
    document.body.innerHTML =
      '<div data-action="outer"><button data-action="inner"><i id="t"></i></button></div>';
    const outer = vi.fn();
    const inner = vi.fn();
    unbind = bindDelegation({ outer, inner }, {});

    click(document.getElementById('t')!);

    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
  });

  test('inherited names are inert', () => {
    document.body.innerHTML = `
      <button id="a" data-action="constructor"></button>
      <button id="b" data-action="__proto__"></button>
      <button id="c" data-action="toString"></button>
      <button id="d" data-action="hasOwnProperty"></button>`;
    const onError = vi.fn();
    unbind = bindDelegation({}, {}, { onError });

    for (const id of ['a', 'b', 'c', 'd']) {
      const event = click(document.getElementById(id)!);
      expect(event.defaultPrevented).toBe(false);
    }
    expect(onError).not.toHaveBeenCalled();
  });

  test('ignores own non-function values and unknown actions', () => {
    document.body.innerHTML = '<button id="a" data-action="bad"></button><button id="b" data-action="nope"></button>';
    unbind = bindDelegation({ bad: 'not a function' as never }, {});
    expect(click(document.getElementById('a')!).defaultPrevented).toBe(false);
    expect(click(document.getElementById('b')!).defaultPrevented).toBe(false);
  });

  test('ignores clicks outside any data-action', () => {
    document.body.innerHTML = '<p id="p">text</p>';
    const go = vi.fn();
    unbind = bindDelegation({ go }, {});
    click(document.getElementById('p')!);
    expect(go).not.toHaveBeenCalled();
  });

  test('preventDefault for button/a actions only', () => {
    document.body.innerHTML = `
      <button id="b" data-action="go"></button>
      <a id="a" href="/x" data-action="go">l</a>
      <div id="d" data-action="go"></div>
      <input id="i" type="checkbox" data-action="go">`;
    unbind = bindDelegation({ go: () => {} }, {});

    expect(click(document.getElementById('b')!).defaultPrevented).toBe(true);
    expect(click(document.getElementById('a')!).defaultPrevented).toBe(true);
    expect(click(document.getElementById('d')!).defaultPrevented).toBe(false);
    expect(click(document.getElementById('i')!).defaultPrevented).toBe(false);
  });

  test('custom attribute names', () => {
    document.body.innerHTML = '<button data-act="go"></button><button data-action="go" id="d"></button>';
    const go = vi.fn();
    unbind = bindDelegation({ go }, {}, { attrs: { click: 'data-act' } });
    click(document.querySelector('[data-act]')!);
    click(document.getElementById('d')!);
    expect(go).toHaveBeenCalledTimes(1);
  });

  test('scoped to a custom root', () => {
    document.body.innerHTML =
      '<section id="root"><button id="in" data-action="go"></button></section><button id="out" data-action="go"></button>';
    const go = vi.fn();
    const root = document.getElementById('root')!;
    unbind = bindDelegation({ go }, {}, { root });
    click(document.getElementById('in')!);
    click(document.getElementById('out')!);
    expect(go).toHaveBeenCalledTimes(1);
  });

  test('a matching ancestor outside a custom root is ignored', () => {
    document.body.innerHTML =
      '<div data-action="go"><section id="root"><span id="in">x</span></section></div>';
    const go = vi.fn();
    unbind = bindDelegation({ go }, {}, { root: document.getElementById('root')! });
    click(document.getElementById('in')!);
    expect(go).not.toHaveBeenCalled();
  });

  test('ignores events without a target element', () => {
    const go = vi.fn();
    unbind = bindDelegation({ go }, {});
    document.dispatchEvent(new Event('click'));
    expect(go).not.toHaveBeenCalled();
  });

  test('text-node targets resolve to their parent element', () => {
    document.body.innerHTML = '<button data-action="go">label</button>';
    const go = vi.fn();
    unbind = bindDelegation({ go }, {});
    const text = document.querySelector('button')!.firstChild!;
    text.dispatchEvent(new Event('click', { bubbles: true }));
    expect(go).toHaveBeenCalledTimes(1);
  });
});

describe('data-stop', () => {
  test('a click on a no-action element inside [data-stop] does not trigger the ancestor action', () => {
    document.body.innerHTML = `
      <div data-action="toggle">
        <div data-stop><span id="plain">x</span></div>
      </div>`;
    const toggle = vi.fn();
    unbind = bindDelegation({ toggle }, {});

    click(document.getElementById('plain')!);

    expect(toggle).not.toHaveBeenCalled();
  });

  test('swallowed clicks are not default-prevented (links still work)', () => {
    document.body.innerHTML = `
      <div data-action="toggle"><div data-stop><a id="l" href="/x">go</a></div></div>`;
    unbind = bindDelegation({ toggle: () => {} }, {});
    expect(click(document.getElementById('l')!).defaultPrevented).toBe(false);
  });

  test('an action inside [data-stop] still runs, the ancestor does not', () => {
    document.body.innerHTML = `
      <div data-action="toggle"><div data-stop><button id="b" data-action="edit"></button></div></div>`;
    const toggle = vi.fn();
    const edit = vi.fn();
    unbind = bindDelegation({ toggle, edit }, {});

    click(document.getElementById('b')!);

    expect(edit).toHaveBeenCalledTimes(1);
    expect(toggle).not.toHaveBeenCalled();
  });

  test('the stop-propagation wrapper pattern absorbs clicks', () => {
    document.body.innerHTML = `
      <div data-action="toggle"><div data-action="stop-propagation" data-stop><span id="s">x</span></div></div>`;
    const toggle = vi.fn();
    const stop = vi.fn();
    unbind = bindDelegation({ toggle, 'stop-propagation': stop }, {});

    click(document.getElementById('s')!);

    expect(stop).toHaveBeenCalledTimes(1);
    expect(toggle).not.toHaveBeenCalled();
  });

  test('data-stop on an action element stops the event reaching window', () => {
    document.body.innerHTML = '<button id="b" data-action="go" data-stop></button><button id="n" data-action="go"></button>';
    const go = vi.fn();
    const atWindow = vi.fn();
    unbind = bindDelegation({ go }, {});
    window.addEventListener('click', atWindow);

    click(document.getElementById('b')!);
    expect(go).toHaveBeenCalledTimes(1);
    expect(atWindow).not.toHaveBeenCalled();

    click(document.getElementById('n')!);
    expect(atWindow).toHaveBeenCalledTimes(1);
    window.removeEventListener('click', atWindow);
  });
});

describe('error handling', () => {
  test('async rejections go to onError(err, el)', async () => {
    document.body.innerHTML = '<button data-action="boom"></button>';
    const err = new Error('nope');
    const onError = vi.fn();
    unbind = bindDelegation({ boom: async () => { throw err; } }, {}, { onError });

    click(document.querySelector('button')!);
    await flush();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBe(err);
    expect(onError.mock.calls[0][1]).toBe(document.querySelector('button'));
  });

  test('sync throws go to onError too', () => {
    document.body.innerHTML = '<button data-action="boom"></button>';
    const onError = vi.fn();
    unbind = bindDelegation({ boom: () => { throw new Error('sync'); } }, {}, { onError });
    click(document.querySelector('button')!);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  test('default onError logs with console.error', async () => {
    document.body.innerHTML = '<button data-action="boom"></button>';
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    unbind = bindDelegation({ boom: () => Promise.reject(new Error('x')) }, {});
    click(document.querySelector('button')!);
    await flush();
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  test('a throwing onError is contained', async () => {
    document.body.innerHTML = '<button data-action="boom"></button>';
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    unbind = bindDelegation(
      { boom: async () => { throw new Error('x'); } },
      {},
      { onError: () => { throw new Error('cb'); } }
    );
    click(document.querySelector('button')!);
    await flush();
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});

describe('change delegation', () => {
  test('dispatches checkbox and select changes with (el, event)', () => {
    document.body.innerHTML = `
      <input id="c" type="checkbox" data-change="pick">
      <select id="s" data-change="room"><option value="a">a</option><option value="b">b</option></select>`;
    const pick = vi.fn();
    const room = vi.fn();
    unbind = bindDelegation({}, { pick, room });

    const checkbox = document.getElementById('c') as HTMLInputElement;
    checkbox.checked = true;
    change(checkbox);
    const select = document.getElementById('s') as HTMLSelectElement;
    select.value = 'b';
    change(select);

    expect(pick).toHaveBeenCalledTimes(1);
    expect(pick.mock.calls[0][0]).toBe(checkbox);
    expect((pick.mock.calls[0][1] as Event).type).toBe('change');
    // happy-dom proxies <select>, so compare by id rather than identity
    expect((room.mock.calls[0][0] as HTMLElement).id).toBe('s');
  });

  test('inherited change names are inert and input clicks are not prevented', () => {
    document.body.innerHTML = '<input id="c" type="checkbox" data-change="constructor" data-action="x">';
    const onError = vi.fn();
    unbind = bindDelegation({ x: () => {} }, {}, { onError });
    change(document.getElementById('c')!);
    expect(onError).not.toHaveBeenCalled();
    expect(click(document.getElementById('c')!).defaultPrevented).toBe(false);
  });

  test('ignores changes outside data-change and with no target', () => {
    document.body.innerHTML = '<input id="c">';
    const fn = vi.fn();
    unbind = bindDelegation({}, { fn });
    change(document.getElementById('c')!);
    document.dispatchEvent(new Event('change'));
    expect(fn).not.toHaveBeenCalled();
  });

  test('custom change attribute and root', () => {
    document.body.innerHTML = '<div id="r"><input id="i" data-on="x"></div><input id="o" data-on="x">';
    const x = vi.fn();
    unbind = bindDelegation({}, { x }, { root: document.getElementById('r')!, attrs: { change: 'data-on' } });
    change(document.getElementById('i')!);
    change(document.getElementById('o')!);
    expect(x).toHaveBeenCalledTimes(1);
  });

  test('a matching ancestor outside a custom root is ignored', () => {
    document.body.innerHTML = '<div data-change="x"><div id="r"><input id="i"></div></div>';
    const x = vi.fn();
    unbind = bindDelegation({}, { x }, { root: document.getElementById('r')! });
    change(document.getElementById('i')!);
    expect(x).not.toHaveBeenCalled();
  });
});

describe('bind / unbind', () => {
  test('unbind removes both listeners and is safe to repeat', () => {
    document.body.innerHTML = '<button data-action="go"></button><input data-change="c">';
    const go = vi.fn();
    const c = vi.fn();
    const off = bindDelegation({ go }, { c });

    off();
    off();
    click(document.querySelector('button')!);
    change(document.querySelector('input')!);

    expect(go).not.toHaveBeenCalled();
    expect(c).not.toHaveBeenCalled();
  });

  test('binding the same root twice does not double-bind and the last maps win', () => {
    document.body.innerHTML = '<button data-action="go"></button>';
    const first = vi.fn();
    const second = vi.fn();
    const off1 = bindDelegation({ go: first }, {});
    const off2 = bindDelegation({ go: second }, {});
    unbind = off2;

    expect(off1).toBe(off2);
    click(document.querySelector('button')!);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  test('can bind again after unbind; a stale unbind does not tear down the new binding', () => {
    document.body.innerHTML = '<button data-action="go"></button>';
    const go = vi.fn();
    const stale = bindDelegation({ go }, {});
    stale();
    unbind = bindDelegation({ go }, {});
    stale();

    click(document.querySelector('button')!);
    expect(go).toHaveBeenCalledTimes(1);
  });

  test('works with no arguments', () => {
    unbind = bindDelegation();
    document.body.innerHTML = '<button data-action="go"></button>';
    expect(() => click(document.querySelector('button')!)).not.toThrow();
  });
});
