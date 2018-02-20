var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
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
        init: function (element, valueAccessor) {
            var container = document.createElement("div");
            ko.virtualElements.setDomNodeChildren(element, [container]);
        },
        update: function (element, valueAccessor) {
            var container = ko.virtualElements.firstChild(element);
            compose(container, ko.toJS(valueAccessor()))
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
            view = vm.getView.apply(vm, args) || view;
        }
        if (!view) {
            return Promise.reject(new CompositionError(vm, "No view is provided!"));
        }
        return view.indexOf("<") === -1 ?
            system.module("text!" + view) :
            Promise.resolve(view);
    }
    //#endregion
    //#region Activation Methods
    function activation(node, options) {
        if (!options.activate) {
            var oldVm = ko.dataFor(node), vm = activator.constructs(options.viewmodel);
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
        var oldVm = ko.dataFor(node);
        // Do not deactivate parents
        return oldVm === ko.dataFor(node.parentNode) ?
            Promise.resolve(oldVm) :
            activator.deactivate(oldVm, newVm);
    }
    //#endregion
    //#region Binding Methods
    function applyBindings(node, oldVm, vm, options) {
        if (oldVm === vm) {
            return;
        }
        clean(node);
        moveNodes(parseMarkup(options.view), node);
        ko.applyBindings(vm, node);
        return activator.bindingComplete(node, vm, options.args);
    }
    function clean(node) {
        ko.cleanNode(node);
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
    }
    function moveNodes(source, dest) {
        while (source.firstChild) {
            dest.appendChild(source.firstChild);
        }
    }
    function parseMarkup(markup) {
        var parser = new DOMParser();
        return parser.parseFromString(markup, "text/html").body;
    }
});
