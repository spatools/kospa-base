(function (factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(["require", "exports", "knockout", "./system"], factory);
    }
})(function (require, exports) {
    "use strict";
    var ko = require("knockout");
    var system = require("./system");
    function constructs(VmModule) {
        return isConstructor(VmModule) ? new VmModule() : VmModule;
    }
    exports.constructs = constructs;
    function activate(VmModule, args) {
        var vm = constructs(VmModule);
        if (!vm || vm.activated || typeof vm.activate !== "function") {
            return Promise.resolve(vm);
        }
        try {
            return Promise.resolve(vm.activate.apply(vm, args)).then(function () {
                vm.activated = true;
                return vm;
            });
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
    exports.activate = activate;
    function deactivate(vm, newVm) {
        if (!vm || !vm.activated || typeof vm.deactivate !== "function") {
            return Promise.resolve(vm);
        }
        try {
            return Promise.resolve(vm.deactivate.call(vm, newVm !== vm)).then(function () {
                vm.activated = false;
                return vm;
            });
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
    exports.deactivate = deactivate;
    function bindingComplete(node, vm, args) {
        if (!vm || typeof vm.bindingComplete !== "function") {
            return Promise.resolve(vm);
        }
        try {
            return Promise.resolve(vm.bindingComplete.apply(vm, [node].concat(args)))
                .then(function () { return vm; });
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
    exports.bindingComplete = bindingComplete;
    function createActivateObservable(target, config) {
        if (!config && !ko.isWriteableObservable(target)) {
            config = target;
            target = null;
        }
        target = target || ko.observable();
        config = config || {};
        var prom = Promise.resolve();
        var result = system.extend(ko.computed({
            read: target,
            write: function (val) {
                var old = target(), args = getArgs(result.args);
                prom = loadModule(val)
                    .then(function (vm) {
                    return deactivate(old, vm)
                        .then(function () { return activate(vm, args); });
                })
                    .then(function (vm) {
                    target(vm);
                    return vm;
                })
                    .catch(function (err) {
                    if (typeof result.onError !== "function") {
                        throw err;
                    }
                    return result.onError(err);
                });
            }
        }), {
            then: function (onSuccess, onError) { return prom.then(onSuccess, onError); },
            catch: function (err) { return prom.catch(err); },
            args: config.args || [],
            onError: config.onError || (function (err) {
                system.error("activator>", err);
                throw err;
            })
        });
        return result;
    }
    exports.createActivateObservable = createActivateObservable;
    ko.extenders["activate"] = function (target, config) {
        return createActivateObservable(target, config);
    };
    function loadModule(mod) {
        return typeof mod === "string" ?
            system.module(mod) :
            Promise.resolve(mod);
    }
    function getArgs(args) {
        return typeof args === "function" ? args() : args;
    }
    function isConstructor(obj) {
        return typeof obj === "function";
    }
});
