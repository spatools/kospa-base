export interface Deferred<T> {
    promise: Promise<T>;
    resolve(val?: T): void;
    reject(err: Error): void;
}

export let enableLog = true;

export function log(...args: any[]): void;
export function log(): void {
    if (enableLog) {
        console.log.apply(console, arguments);
    }
}

export function error(...args: any[]): void;
export function error(): void {
    if (enableLog) {
        console.error.apply(console, arguments);
    }
}

export const extend = (function (Obj: any) {
    if ("assign" in Obj) {
        return Obj.assign;
    }

    return function assign(target: any): any {
        if (typeof target === "undefined") {
            throw new Error("Please specify a target object");
        }

        var T = Object(target),
            l = arguments.length,
            i = 1, S;

        function assignKey(key: string): void {
            T[key] = this[key];
        }

        while (l > i) {
            S = Object(arguments[i++]);
            Object.keys(S).forEach(assignKey, S);
        }

        return T;
    };
})(Object) as (target: any, ...sources: any[]) => any;

export function module<T>(name: string): Promise<T>;
export function module<T>(names: string[]): Promise<T[]>;
export function module<T>(...names: string[]): Promise<T[]>;
export function module<T>(): Promise<T | T[]> {
    var args = Array.prototype.slice.call(arguments);
    if (args.length === 0) {
        return Promise.resolve(null);
    }

    return new Promise<any>((resolve, reject) => {
        if (args.length === 1 && Array.isArray(args[0])) {
            args = args[0];
        }

        try {
            require(
                args,
                (...mods: any[]) => { resolve(mods.length === 1 ? mods[0] : mods); },
                (err) => { reject(err); }
            );
        }
        catch (e) {
            reject(e);
        }
    });
}

export function deferred(): Deferred<any>;
export function deferred<T>(): Deferred<T>;
export function deferred<T>(): Deferred<T> {
    const defer = {
        resolve: null,
        reject: null,
        promise: null
    } as Deferred<any>;

    defer.promise = new Promise((resolve, reject) => {
        defer.resolve = resolve;
        defer.reject = reject;
    });

    return defer;
}

export function asyncEach<T>(array: T[], iterator: (item: T, index: number, list: T[]) => Promise<any>): Promise<void> {
    return new Promise<void>((resolve: any, reject) => {
        var p = Promise.resolve(),
            i = 0, len = array.length;

        function partial(value: T, index: number): () => Promise<any> {
            return () => iterator(value, index, array);
        }

        for (; i < len; i++) {
            p = p.then(partial(array[i], i));
        }

        return p.then(() => resolve(), reject);
    });
}
