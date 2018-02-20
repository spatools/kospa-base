/// <reference types="knockout" />
import * as ko from "knockout";
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
    new (): ViewModel;
    getView?(...args: any[]): string;
}
export declare type ViewModelOrConstructor = ViewModel | ViewModelConstructor;
export declare function constructs(VmModule: ViewModelOrConstructor): ViewModel;
export declare function activate(VmModule: ViewModelOrConstructor, args?: any[]): Promise<ViewModel>;
export declare function deactivate(vm: ViewModel, newVm?: ViewModel): Promise<ViewModel>;
export declare function bindingComplete(node: Node, vm: ViewModel, args?: any[]): Promise<ViewModel>;
export declare function createActivateObservable<T extends ViewModel>(): ActivateObservable<T>;
export declare function createActivateObservable<T extends ViewModel>(config: ActivateObservableOptions): ActivateObservable<T>;
export declare function createActivateObservable<T extends ViewModel>(target: ko.Observable<T>, config: ActivateObservableOptions): ActivateObservable<T>;
