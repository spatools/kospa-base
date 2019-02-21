var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "knockout", "./system", "./activator"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ko = require("knockout");
    var system = require("./system");
    var activator = require("./activator");
    var VIEW_CACHE = {};
    var CompositionError = /** @class */ (function (_super) {
        __extends(CompositionError, _super);
        function CompositionError(vm, innerError) {
            var _this = _super.call(this, "composer: " + (innerError ? innerError : "Unknown")) || this;
            _this.vm = vm;
            _this.innerError = innerError;
            if (innerError && typeof innerError.stack !== "undefined") {
                Object.defineProperty(_this, "stack", { get: function () { return innerError.stack; } });
            }
            return _this;
        }
        return CompositionError;
    }(Error));
    exports.CompositionError = CompositionError;
    /**
     * Compose a ViewModel and a View into an element using Require.JS.
     * @param element - HTMLElement to compose on or its ID.
     * @param options - Composition Options.
     */
    function compose(element, options) {
        var node = typeof element === "string" ?
            document.getElementById(element) :
            element;
        if (!node) {
            throw new CompositionError(options.viewmodel, "Can't find element: " + element);
        }
        return loadComponents(options)
            .then(function (options) { return activation(node, options); })
            .catch(function (err) {
            if (err instanceof CompositionError) {
                throw err;
            }
            throw new CompositionError(options.viewmodel, err);
        })
            .then(function () { return node; });
    }
    exports.compose = compose;
    //#endregion
    //#region Knockout Handlers
    ko.bindingHandlers["compose"] = {
        init: function () {
            return { controlsDescendantBindings: true };
        },
        update: function (element, valueAccessor) {
            compose(element, ko.toJS(valueAccessor()))
                .catch(system.error);
        }
    };
    ko.virtualElements.allowedBindings["compose"] = true;
    ko.components.register("kospa-compose", { template: "<!--ko compose: $data--><!--/ko-->" });
    //#endregion
    //#region Loading Methods
    function loadComponents(options) {
        return loadViewModel(options.viewmodel)
            .then(function (vm) {
            if (!vm) {
                throw new CompositionError(options.viewmodel, "ViewModel module can't be empty!");
            }
            options.viewmodel = vm;
        })
            .then(function () { return loadView(options.view, options.viewmodel, options.args); })
            .then(function (view) { options.view = view; })
            .then(function () { return options; });
    }
    function loadViewModel(viewmodel) {
        return typeof viewmodel === "string" ?
            system.module(viewmodel) :
            Promise.resolve(viewmodel);
    }
    function loadView(view, vm, args) {
        if (vm && typeof vm.getView === "function") {
            view = vm.getView.apply(vm, (args || [])) || view;
        }
        if (!view) {
            return Promise.reject(new CompositionError(vm, "No view is provided!"));
        }
        return parseView(view);
    }
    function parseView(view) {
        if (typeof view === "string") {
            if (VIEW_CACHE[view]) {
                return Promise.resolve(VIEW_CACHE[view]);
            }
            if (view.indexOf("<") === -1) {
                return system.module("text!" + view)
                    .then(function (tpl) { return parseView(tpl); })
                    .then(function (tpl) { return VIEW_CACHE[view] = tpl; });
            }
            return Promise.resolve(ko.utils.parseHtmlFragment(view))
                .then(function (tpl) { return VIEW_CACHE[view] = tpl; });
        }
        if (Array.isArray(view)) {
            return Promise.resolve(view);
        }
        if (isDocumentFragment(view)) {
            return Promise.resolve(arrayFromNodeList(view.childNodes));
        }
        throw new Error("Unknown view value: " + view);
    }
    //#endregion
    //#region Activation Methods
    function activation(node, options) {
        if (!options.activate) {
            var oldVm = ko.utils.domData.get(node, "kospa_vm"), vm = activator.constructs(options.viewmodel);
            return applyBindings(node, oldVm, vm, options);
        }
        return deactivateNode(node, options.viewmodel)
            .then(function (oldVm) { return activateNode(node, oldVm, options); });
    }
    function activateNode(node, oldVm, options) {
        return activator.activate(options.viewmodel, options.args)
            .then(function (vm) { return applyBindings(node, oldVm, vm, options); });
    }
    function deactivateNode(node, newVm) {
        var oldVm = ko.utils.domData.get(node, "kospa_vm");
        return activator.deactivate(oldVm, newVm);
    }
    //#endregion
    //#region Binding Methods
    function applyBindings(node, oldVm, vm, options) {
        if (oldVm === vm) {
            return Promise.resolve(vm);
        }
        clean(node);
        moveNodes(options.view, node);
        ko.applyBindingsToDescendants(vm, node);
        ko.utils.domData.set(node, "kospa_vm", vm);
        return activator.bindingComplete(node, vm, options.args);
    }
    function clean(node) {
        ko.virtualElements.emptyNode(node);
    }
    function moveNodes(nodes, dest) {
        ko.virtualElements.setDomNodeChildren(dest, cloneNodes(nodes));
    }
    function cloneNodes(nodes) {
        return nodes.map(function (node) { return node.cloneNode(true); });
    }
    function arrayFromNodeList(nodes) {
        return Array.prototype.slice.call(nodes);
    }
    function isDocumentFragment(obj) {
        return typeof DocumentFragment !== "undefined" ?
            obj instanceof DocumentFragment :
            obj && obj.nodeType === 11;
    }
});
