import * as ko from "knockout";
import * as system from "./system";
import * as activator from "./activator";

export type ViewModel = activator.ViewModel;
export type ViewModelConstructor = activator.ViewModelConstructor;
export type ViewModelOrConstructor = activator.ViewModelOrConstructor;

//#region Composition

export interface CompositionOptions {
    viewmodel: string | ViewModelOrConstructor;
    view: string;
    args?: any[];
    activate?: boolean;
}

export class CompositionError extends Error {
    constructor(
        public vm: string | ViewModelOrConstructor,
        public innerError?: string | Error
    ) {
        super(`composer: ${innerError ? innerError : "Unknown"}`);

        if (innerError && typeof (<any>innerError).stack !== "undefined") {
            Object.defineProperty(this, "stack", { get: () => (<any>innerError).stack });
        }
    }
}

/**
 * Compose a ViewModel and a View into an element using Require.JS.
 * @param element - HTMLElement to compose on or its ID.
 * @param options - Composition Options.
 */
export function compose(element: string | Node, options: CompositionOptions): Promise<Node> {
    const
        node = typeof element === "string" ?
            document.getElementById(element) :
            element;

    return loadComponents(options)
        .then(() => activation(node, options))
        .catch(err => {
            if (err instanceof CompositionError) {
                throw err;
            }

            throw new CompositionError(options.viewmodel, err);
        })
        .then(() => node);
}

//#endregion

//#region Knockout Handlers

ko.bindingHandlers["compose"] = {
    init: (element: Node, valueAccessor) => {
        const container = document.createElement("div");
        ko.virtualElements.setDomNodeChildren(element, [container]);
    },
    update: (element: Node, valueAccessor) => {
        const container = ko.virtualElements.firstChild(element) as Node;
        compose(container, ko.toJS(valueAccessor()))
            .catch(system.error);
    }
} as ko.BindingHandler;

ko.virtualElements.allowedBindings["compose"] = true;

ko.components.register("kospa-compose", { template: `<!--ko compose: $data--><!--/ko-->` });

//#endregion

//#region Loading Methods

function loadComponents(options: CompositionOptions): Promise<void> {

    return loadViewModel(options.viewmodel)
        .then(vm => {
            if (!vm) {
                throw new CompositionError(options.viewmodel, "ViewModel module can't be empty!");
            }

            options.viewmodel = vm;
        })
        .then(() => loadView(options.view, options.viewmodel, options.args))
        .then(view => { options.view = view; });
}

function loadViewModel(viewmodel: string | ViewModelOrConstructor): Promise<ViewModelOrConstructor> {
    return typeof viewmodel === "string" ?
        system.module<ViewModelOrConstructor>(viewmodel) :
        Promise.resolve(viewmodel);
}

function loadView(view: string, vm: ViewModelOrConstructor, args: any[]): Promise<string> {
    if (vm && typeof vm.getView === "function") {
        view = vm.getView(...args) || view;
    }

    if (!view) {
        return Promise.reject(new CompositionError(vm, "No view is provided!"));
    }

    return view.indexOf("<") === -1 ?
        system.module<string>("text!" + view) :
        Promise.resolve(view);
}

//#endregion

//#region Activation Methods

function activation(node: Node, options: CompositionOptions): Promise<ViewModel> {
    if (!options.activate) {
        const
            oldVm = ko.dataFor(node) as ViewModel,
            vm = activator.constructs(options.viewmodel);

        return applyBindings(node, oldVm, vm, options);
    }

    return deactivateNode(node, options.viewmodel)
        .then(oldVm => activateNode(node, oldVm, options));
}

function activateNode(node: Node, oldVm: ViewModel, options: CompositionOptions): Promise<ViewModel> {
    return activator.activate(options.viewmodel, options.args)
        .then(vm => applyBindings(node, oldVm, vm, options));
}

function deactivateNode(node: Node, newVm: ViewModelOrConstructor): Promise<ViewModel> {
    const oldVm = ko.dataFor(node) as ViewModel;

    // Do not deactivate parents
    return oldVm === ko.dataFor(node.parentNode) ?
        Promise.resolve(oldVm) :
        activator.deactivate(oldVm, newVm);
}

//#endregion

//#region Binding Methods

function applyBindings(node: Node, oldVm: ViewModel, vm: ViewModel, options: CompositionOptions): Promise<ViewModel> {
    if (oldVm === vm) {
        return;
    }

    clean(node);
    moveNodes(parseMarkup(options.view), node);
    ko.applyBindings(vm, node);

    return activator.bindingComplete(node, vm, options.args);
}

function clean(node: Node): void {
    ko.cleanNode(node as Element);

    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

function moveNodes(source: Node, dest: Node): void {
    while (source.firstChild) {
        dest.appendChild(source.firstChild);
    }
}

function parseMarkup(markup: string): Element {
    const parser = new DOMParser();
    return parser.parseFromString(markup, "text/html").body;
}

//#endregion
