﻿import * as ko from "knockout";
import * as system from "./system";

export interface ActivateObservableOptions {
    args?: any[] | (() => any[]);
    onError?: (err: any) => any;
}

export interface ActivateObservable<T extends ViewModel> extends ko.Observable<T>, PromiseLike<T> {
    (): T;
    (val: T): void;
    (val: string): void;

    catch: (err: any) => any;

    onError: (err: any) => void;
    args: any[] | (() => any[]);
}

export interface ViewModel {
    activated?: boolean;
    title?: string | ko.Observable<string>;

    activate?(...args: any[]): void | Promise<any>;
    deactivate?(closing?: boolean): void | Promise<any>;
    bindingComplete?(node: Node, ...args: any[]): void | Promise<any>;

    getView?(...args: any[]): string;
}

export interface ViewModelConstructor {
    new(): ViewModel;

    getView?(...args: any[]): string;
}

export type ViewModelOrConstructor = ViewModel | ViewModelConstructor;

export function constructs(VmModule: ViewModelOrConstructor): ViewModel {
    return isConstructor(VmModule) ? new VmModule() : VmModule;
}

export function activate(VmModule: ViewModelOrConstructor, args?: any[]): Promise<ViewModel> {
    const vm = constructs(VmModule);
    if (!vm || vm.activated || typeof vm.activate !== "function") {
        return Promise.resolve(vm);
    }

    try {
        return Promise.resolve(vm.activate.apply(vm, args)).then(() => {
            vm.activated = true;
            return vm;
        });
    }
    catch (err) {
        return Promise.reject(err);
    }
}

export function deactivate(vm: ViewModel, newVm?: ViewModel): Promise<ViewModel> {
    if (!vm || !vm.activated || typeof vm.deactivate !== "function") {
        return Promise.resolve(vm);
    }

    try {
        return Promise.resolve(vm.deactivate.call(vm, newVm !== vm)).then(() => {
            vm.activated = false;
            return vm;
        });
    }
    catch (err) {
        return Promise.reject(err);
    }
}

export function bindingComplete(node: Node, vm: ViewModel, args?: any[]): Promise<ViewModel> {
    if (!vm || typeof vm.bindingComplete !== "function") {
        return Promise.resolve(vm);
    }

    try {
        return Promise.resolve(vm.bindingComplete.apply(vm, [node].concat(args)))
            .then(() => vm);
    }
    catch (err) {
        return Promise.reject(err);
    }
}

export function createActivateObservable<T extends ViewModel>(): ActivateObservable<T>;
export function createActivateObservable<T extends ViewModel>(config: ActivateObservableOptions): ActivateObservable<T>;
export function createActivateObservable<T extends ViewModel>(target: ko.Observable<T>, config: ActivateObservableOptions): ActivateObservable<T>;
export function createActivateObservable<T extends ViewModel>(target?: any, config?: ActivateObservableOptions): ActivateObservable<T> {
    if (!config && !ko.isWriteableObservable(target)) {
        config = target;
        target = null;
    }

    target = target || ko.observable<T>();
    config = config || {};

    let prom = Promise.resolve<any>(null);

    const result = system.extend(
        ko.computed<any>({
            read: target,
            write: (val) => {
                const
                    old = target(),
                    args = getArgs(result.args);

                prom = loadModule<T>(val)
                    .then(vm =>
                        deactivate(old, vm)
                            .then(() => activate(vm, args))
                    )
                    .then(vm => {
                        target(vm);
                        return vm;
                    })
                    .catch(err => {
                        if (typeof result.onError !== "function") {
                            throw err;
                        }

                        return result.onError(err);
                    });
            }
        }),
        {
            then: (onSuccess, onError) => prom.then(onSuccess, onError),
            catch: (err) => prom.catch(err),

            args: config.args || [],
            onError: config.onError || (err => {
                system.error("activator>", err);
                throw err;
            })
        }
    ) as ActivateObservable<any>;

    return result;
}

ko.extenders["activate"] = (target: ko.Observable<any>, config?: ActivateObservableOptions) => {
    return createActivateObservable(target, config);
};

function loadModule<T>(mod: string | T): Promise<T> {
    return typeof mod === "string" ?
        system.module<T>(mod) :
        Promise.resolve<T>(mod);
}

function getArgs(args: any): any[] {
    return typeof args === "function" ? args() : args;
}

function isConstructor(obj: any): obj is ViewModelConstructor {
    return typeof obj === "function";
}
