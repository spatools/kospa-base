(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.enableLog = true;
    function log() {
        if (exports.enableLog) {
            console.log.apply(console, arguments);
        }
    }
    exports.log = log;
    function error() {
        if (exports.enableLog) {
            console.error.apply(console, arguments);
        }
    }
    exports.error = error;
    exports.extend = (function (Obj) {
        if ("assign" in Obj) {
            return Obj.assign;
        }
        return function assign(target) {
            if (typeof target === "undefined") {
                throw new Error("Please specify a target object");
            }
            var T = Object(target), l = arguments.length, i = 1, S;
            function assignKey(key) {
                T[key] = this[key];
            }
            while (l > i) {
                S = Object(arguments[i++]);
                Object.keys(S).forEach(assignKey, S);
            }
            return T;
        };
    })(Object);
    function module() {
        var args = Array.prototype.slice.call(arguments);
        if (args.length === 0) {
            return Promise.resolve(null);
        }
        return new Promise(function (resolve, reject) {
            if (args.length === 1 && Array.isArray(args[0])) {
                args = args[0];
            }
            try {
                require(args, function () {
                    var mods = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        mods[_i] = arguments[_i];
                    }
                    resolve(mods.length === 1 ? mods[0] : mods);
                }, function (err) { reject(err); });
            }
            catch (e) {
                reject(e);
            }
        });
    }
    exports.module = module;
    function deferred() {
        var defer = {
            resolve: null,
            reject: null,
            promise: null
        };
        defer.promise = new Promise(function (resolve, reject) {
            defer.resolve = resolve;
            defer.reject = reject;
        });
        return defer;
    }
    exports.deferred = deferred;
    function asyncEach(array, iterator) {
        return new Promise(function (resolve, reject) {
            var p = Promise.resolve(), i = 0, len = array.length;
            function partial(value, index) {
                return function () { return iterator(value, index, array); };
            }
            for (; i < len; i++) {
                p = p.then(partial(array[i], i));
            }
            return p.then(function () { return resolve(); }, reject);
        });
    }
    exports.asyncEach = asyncEach;
});
