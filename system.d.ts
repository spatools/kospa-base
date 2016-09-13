export interface Deferred<T> {
    promise: Promise<T>;
    resolve(val?: T): void;
    reject(err: Error): void;
}
export declare let enableLog: boolean;
export declare function log(...args: any[]): void;
export declare function error(...args: any[]): void;
export declare const extend: (target: any, ...sources: any[]) => any;
export declare function module<T>(name: string): Promise<T>;
export declare function module<T>(names: string[]): Promise<T[]>;
export declare function module<T>(...names: string[]): Promise<T[]>;
export declare function deferred(): Deferred<any>;
export declare function deferred<T>(): Deferred<T>;
export declare function asyncEach<T>(array: T[], iterator: (item: T, index: number, list: T[]) => Promise<any>): Promise<void>;
