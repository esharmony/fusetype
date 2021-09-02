import { State, FuseTypeState, Update } from './FuseStateTypes';

class Index {
  [key: string]: any;
}

class FuseType<S> extends Index {
  state: any;
  observers: Update<S>[] = [];
  prevState: any;
  constructor({ state, ...rest }: State) {
    super();
    this.state = state;
    this.observers = [];
    this.prevState = { ...state };
    this.defaultState = { ...state };

    const obj = { ...rest } as any,
      objs = Object.getOwnPropertyNames(obj);

    for (var i in objs) {
      if (objs[i] !== 'state') {
        const ref = obj[objs[i]];
        if (ref[Symbol.toStringTag] === 'AsyncFunction') {
          obj[objs[i]] = function () {
            const args = arguments,
              that = this;
            return new Promise(function (resolve) {
              ref.apply(that, args).then(() => {
                resolve(that);
                that.notify();
              });
            });
          };
        } else {
          obj[objs[i]] = function () {
            ref.apply(this, arguments);
            this.notify();
          };
        }
        this[objs[i]] = obj[objs[i]];
      }
    }
  }

  private nameFunction(name: string, body: Function) {
    return {
      [name](...args: any) {
        return body(...args);
      },
    }[name];
  }

  register(observer: Update<S>, id: string) {
    const namedObserver = this.nameFunction(id, observer);
    this.observers.push(namedObserver);
  }

  remove(id: string) {
    this.observers = this.observers.filter((observer) => observer.name !== id);
  }

  getLatestState = () => this.notify();

  async notify() {
    this.observers.forEach((observer) =>
      observer({ ...this.state }, { ...this.prevState })
    );
    this.prevState = { ...this.state };
  }

  clearState = () => {
    for (const [key, value] of Object.entries(this.clone(this.defaultState))) {
      this.state[key] = value;
    }
    this.notify();
  };

  private cloneOtherType(target: any) {
    const constrFun = target.constructor;
    switch (this.toRawType(target)) {
      case 'Boolean':
      case 'Number':
      case 'String':
      case 'Error':
      case 'Date':
        return new constrFun(target);
      case 'RegExp':
        return this.cloneReg(target);
      case 'Symbol':
        return this.cloneSymbol(target);
      case 'Function':
        return target;
      default:
        return null;
    }
  }

  private toRawType(value: any) {
    let _toString = Object.prototype.toString;
    let str = _toString.call(value);
    return str.slice(8, -1);
  }

  private cloneSymbol(targe: any) {
    return Object(Symbol.prototype.valueOf.call(targe));
  }

  private cloneReg(targe: any) {
    const reFlags = /\w*$/;
    const result = new targe.constructor(targe.source, reFlags.exec(targe));
    result.lastIndex = targe.lastIndex;
    return result;
  }

  private forEach(array: Array<any>, iteratee: any) {
    let index = -1;
    const length = array.length;
    while (++index < length) {
      iteratee(array[index], index);
    }
    return array;
  }

  private clone(target: any, map = new WeakMap()) {
    // clone primitive types
    if (typeof target !== 'object' || target == null) {
      return target;
    }

    const type = this.toRawType(target);
    let cloneTarget: any = null;

    if (map.get(target)) {
      return map.get(target);
    }
    map.set(target, cloneTarget);

    if (type !== 'Set' && type !== 'Map' && type !== 'Array' && type !=='Object') {
      return this.cloneOtherType(target);
    }

    // clone Set
    if (type === 'Set') {
      cloneTarget = new Set();
      target.forEach((value: any) => {
        cloneTarget.add(this.clone(value, map));
      });
      return cloneTarget;
    }

    // clone Map
    if (type === 'Map') {
      cloneTarget = new Map();
      target.forEach((value: any, key: any) => {
        cloneTarget.set(key, this.clone(value, map));
      });
      return cloneTarget;
    }

    // clone Array
    if (type === 'Array') {
      cloneTarget = [];
      this.forEach(target, (value: any, index: any) => {
        cloneTarget[index] = this.clone(value, map);
      });
    }

    // clone normal Object
    if (type === 'Object') {
      cloneTarget = {};
      this.forEach(Object.keys(target), (key: any) => {
        cloneTarget[key] = this.clone(target[key], map);
      });
    }

    return cloneTarget;
  }
}

export function CreateFuseType<T, S>(state: State) {
  return new FuseType<S>(state) as unknown as FuseTypeState<T, S>;
}
