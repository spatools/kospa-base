import * as ko from "knockout";
export interface ActivateObservableOptions {
    args?: any[] | (() => any[]);
    onError?: (err: any) => any;
}
export interface ActivateObservable<T extends ViewModel | null | undefined> extends ko.Observable<T>, PromiseLike<T> {
    (): T;
    (val: string | T | ViewModelConstructor<T>): void;
    catch: (err: any) => any;
    onError: (err: any) => void;
    args: any[] | (() => any[]);
}
export declare type View = string | Node[] | DocumentFragment;
export interface ViewModel {
    activated?: boolean;
    title?: ko.MaybeSubscribable<string>;
    activate?(...args: any[]): void | Promise<any>;
    deactivate?(closing?: boolean): void | Promise<any>;
    bindingComplete?(node: Node, ...args: any[]): void | Promise<any>;
    getView?(...args: any[]): View;
}
export interface ViewModelConstructor<T extends ViewModel | null | undefined = ViewModel> {
    new (): T;
    getView?(...args: any[]): string;
}
export declare type ViewModelOrConstructor = ViewModel | ViewModelConstructor;
export declare function constructs(VmModule: null | undefined): null | undefined;
export declare function constructs(VmModule: ViewModelOrConstructor): ViewModel;
export declare function constructs(VmModule: ViewModelOrConstructor | null | undefined): ViewModel | null | undefined;
export declare function activate(VmModule: null | undefined, args?: any[]): Promise<null | undefined>;
export declare function activate(VmModule: ViewModelOrConstructor, args?: any[]): Promise<ViewModel>;
export declare function activate(VmModule: ViewModelOrConstructor | null | undefined, args?: any[]): Promise<ViewModel | null | undefined>;
export declare function deactivate(vm: null | undefined, newVm?: ViewModel | null | undefined): Promise<null | undefined>;
export declare function deactivate(vm: ViewModel, newVm?: ViewModel | null | undefined): Promise<ViewModel | null | undefined>;
export declare function deactivate(vm: ViewModel | null | undefined, newVm?: ViewModel | null | undefined): Promise<ViewModel | null | undefined>;
export declare function bindingComplete(node: Node, vm: null | undefined, args?: any[]): Promise<null | undefined>;
export declare function bindingComplete(node: Node, vm: ViewModel, args?: any[]): Promise<ViewModel>;
export declare function bindingComplete(node: Node, vm: ViewModel | null | undefined, args?: any[]): Promise<ViewModel | null | undefined>;
export declare function createActivateObservable<T extends ViewModel | null | undefined>(): ActivateObservable<T>;
export declare function createActivateObservable<T extends ViewModel | null | undefined>(config: ActivateObservableOptions): ActivateObservable<T>;
export declare function createActivateObservable<T extends ViewModel | null | undefined>(target: ko.Observable<T>, config?: ActivateObservableOptions): ActivateObservable<T>;
