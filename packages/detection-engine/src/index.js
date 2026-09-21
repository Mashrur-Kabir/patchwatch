"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanFiles = scanFiles;
var child_process_1 = require("child_process");
var util_1 = require("util");
var execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
function scanFiles(filePaths, repoRootPath) {
    return __awaiter(this, void 0, void 0, function () {
        var stdout, stderr, result, error_1, parsed, findings, results, _i, results_1, result, severity, semgrepSev;
        var _a, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    if (filePaths.length === 0) {
                        return [2 /*return*/, []];
                    }
                    _f.label = 1;
                case 1:
                    _f.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, execFileAsync("semgrep", __spreadArray(["--config", "auto", "--json"], filePaths, true), { cwd: repoRootPath, maxBuffer: 1024 * 1024 * 50 } // 50MB buffer for large JSON outputs
                        )];
                case 2:
                    result = _f.sent();
                    stdout = result.stdout;
                    stderr = result.stderr;
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _f.sent();
                    // semgrep exits with code 1 if findings are found, which causes execFile to throw.
                    // We only throw if it's an actual failure (e.g. command not found, syntax error, exit code 2+)
                    if (error_1.code && error_1.code !== 1 && error_1.code !== 0) {
                        throw new Error("Failed to run Semgrep: ".concat(error_1.message));
                    }
                    // Command not found throws with error.code === 'ENOENT'
                    if (error_1.code === 'ENOENT') {
                        throw new Error("Semgrep is not installed or not in PATH");
                    }
                    // It exited with code 1 (findings found) or some other error with stdout
                    if (!error_1.stdout) {
                        throw new Error("Failed to run Semgrep: ".concat(error_1.message));
                    }
                    stdout = error_1.stdout;
                    return [3 /*break*/, 4];
                case 4:
                    try {
                        parsed = JSON.parse(stdout);
                    }
                    catch (err) {
                        throw new Error("Failed to parse Semgrep JSON output: ".concat(err));
                    }
                    findings = [];
                    results = parsed.results || [];
                    for (_i = 0, results_1 = results; _i < results_1.length; _i++) {
                        result = results_1[_i];
                        severity = "low";
                        semgrepSev = (_a = result.extra) === null || _a === void 0 ? void 0 : _a.severity;
                        if (semgrepSev === "WARNING")
                            severity = "medium";
                        else if (semgrepSev === "ERROR")
                            severity = "high";
                        findings.push({
                            severity: severity,
                            filePath: result.path,
                            lineStart: ((_b = result.start) === null || _b === void 0 ? void 0 : _b.line) || 0,
                            lineEnd: ((_c = result.end) === null || _c === void 0 ? void 0 : _c.line) || ((_d = result.start) === null || _d === void 0 ? void 0 : _d.line) || 0,
                            message: ((_e = result.extra) === null || _e === void 0 ? void 0 : _e.message) || "",
                            ruleId: result.check_id || "",
                        });
                    }
                    return [2 /*return*/, findings];
            }
        });
    });
}
