import * as activator from "./activator";
export declare type ViewModel = activator.ViewModel;
export declare type ViewModelConstructor = activator.ViewModelConstructor;
export declare type ViewModelOrConstructor = activator.ViewModelOrConstructor;
export interface CompositionOptions {
    viewmodel: string | ViewModelOrConstructor;
    view: string;
    args?: any[];
    activate?: boolean;
}
export declare class CompositionError extends Error {
    vm: string | ViewModelOrConstructor;
    innerError: string | Error;
    constructor(vm: string | ViewModelOrConstructor, innerError?: string | Error);
}
/**
 * Compose a ViewModel and a View into an element using Require.JS.
 * @param element - HTMLElement to compose on or its ID.
 * @param options - Composition Options.
 */
export declare function compose(element: string | Node, options: CompositionOptions): Promise<Node>;
