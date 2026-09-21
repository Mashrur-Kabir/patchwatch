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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var node_test_1 = require("node:test");
var node_assert_1 = __importDefault(require("node:assert"));
var path_1 = __importDefault(require("path"));
var index_1 = require("./index");
(0, node_test_1.describe)("scanFiles", function () {
    (0, node_test_1.test)("finds an issue in a bad file", function () { return __awaiter(void 0, void 0, void 0, function () {
        var fixturePath, repoRoot, findings, finding;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fixturePath = path_1.default.join(__dirname, "..", "fixtures", "bad.js");
                    repoRoot = path_1.default.join(__dirname, "..", "fixtures");
                    return [4 /*yield*/, (0, index_1.scanFiles)(["bad.js"], repoRoot)];
                case 1:
                    findings = _a.sent();
                    node_assert_1.default.ok(findings.length > 0, "Should find at least one issue");
                    finding = findings[0];
                    node_assert_1.default.ok(finding.severity === "low" || finding.severity === "medium" || finding.severity === "high");
                    node_assert_1.default.strictEqual(finding.filePath, "bad.js");
                    node_assert_1.default.ok(finding.lineStart > 0);
                    node_assert_1.default.ok(finding.message.length > 0);
                    node_assert_1.default.ok(finding.ruleId.length > 0);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, node_test_1.test)("returns empty array for a clean file", function () { return __awaiter(void 0, void 0, void 0, function () {
        var repoRoot, findings;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    repoRoot = path_1.default.join(__dirname, "..", "fixtures");
                    return [4 /*yield*/, (0, index_1.scanFiles)(["good.js"], repoRoot)];
                case 1:
                    findings = _a.sent();
                    node_assert_1.default.strictEqual(findings.length, 0, "Should find zero issues");
                    return [2 /*return*/];
            }
        });
    }); });
    (0, node_test_1.test)("throws error when passing a bad path to force semgrep failure", function () { return __awaiter(void 0, void 0, void 0, function () {
        var repoRoot, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    repoRoot = path_1.default.join(__dirname, "..", "fixtures");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, index_1.scanFiles)(["does_not_exist.js"], repoRoot)];
                case 2:
                    _a.sent();
                    node_assert_1.default.fail("Should have thrown an error");
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    node_assert_1.default.ok(error_1.message.includes("Failed to run Semgrep"), "Should throw clear error");
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
});
