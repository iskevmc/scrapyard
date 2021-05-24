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
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const assert = require("assert");
const fs = require("fs");
const helper_1 = require("./helper");
suite('Should have failures with a bad template', () => {
    const docUri = helper_1.getDocUri('bad.yaml');
    test('Diagnoses bad template', () => __awaiter(void 0, void 0, void 0, function* () {
        yield testDiagnostics(docUri, [
            {
                severity: vscode.DiagnosticSeverity.Error,
                message: '[cfn-lint] E1001: Top level template section Errors is not valid',
                range: toRange(2, 0, 2, 6)
            },
            {
                severity: vscode.DiagnosticSeverity.Warning,
                message: '[cfn-lint] W2001: Parameter myParam not used.',
                range: toRange(5, 2, 5, 9)
            },
            {
                severity: vscode.DiagnosticSeverity.Error,
                message: '[cfn-lint] E3001: Invalid or unsupported Type AWS::EC2::Instance1 for resource MyEC2Instance1 in us-east-1',
                range: toRange(12, 4, 12, 8)
            }
        ]);
    }));
});
suite('Should not have failures on a good template', () => {
    const docUri = helper_1.getDocUri('good.yaml');
    test('Diagnose good template', () => __awaiter(void 0, void 0, void 0, function* () {
        yield testDiagnostics(docUri, []);
    }));
});
suite('Should not have failures a non CloudFormation Template', () => {
    const docUri = helper_1.getDocUri('not_template.yaml');
    test('Diagnose good template', () => __awaiter(void 0, void 0, void 0, function* () {
        yield testDiagnostics(docUri, []);
    }));
});
suite('Should have failures even though AWSTemplateFormatVersion isn\'t in the file', () => {
    const docUri = helper_1.getDocUri('still_a_template.yaml');
    test('Diagnoses a bad template without AWSTemplateFormatVersion', () => __awaiter(void 0, void 0, void 0, function* () {
        yield testDiagnostics(docUri, [
            {
                severity: vscode.DiagnosticSeverity.Error,
                message: '[cfn-lint] E3002: Invalid Property Resources/RootRole/Properties/BadKey',
                range: toRange(5, 6, 5, 12)
            }
        ]);
    }));
});
suite('Should have failures even though AWSTemplateFormatVersion isn\'t in the file', () => {
    const docUri = helper_1.getDocUri('still_a_template_2.yaml');
    test('Diagnoses a bad template without AWSTemplateFormatVersion', () => __awaiter(void 0, void 0, void 0, function* () {
        yield testDiagnostics(docUri, [
            {
                severity: vscode.DiagnosticSeverity.Error,
                message: '[cfn-lint] E3002: Invalid Property Resources/RootRole/Properties/BadKey',
                range: toRange(4, 6, 4, 12)
            }
        ]);
    }));
});
suite('Should have failures even with a space in the filename', () => {
    const docUri = helper_1.getDocUri('a template.yaml');
    test('Diagnoses a bad template with spaces in the name', () => __awaiter(void 0, void 0, void 0, function* () {
        yield testDiagnostics(docUri, [
            {
                severity: vscode.DiagnosticSeverity.Error,
                message: '[cfn-lint] E3002: Invalid Property Resources/RootRole/Properties/BadKey',
                range: toRange(5, 6, 5, 12)
            }
        ]);
    }));
});
suite('Previews should work', () => {
    const docUri = 'preview.yaml';
    const dotUri = 'preview.yaml.dot';
    test('Does NOT create .dot file if a preview was not requested', () => __awaiter(void 0, void 0, void 0, function* () {
        yield helper_1.activate(helper_1.getDocUri(docUri));
        assert.strictEqual(!fs.existsSync(helper_1.getDocPath(dotUri)), true);
    }));
    test('Does create .dot file if a preview was requested', () => __awaiter(void 0, void 0, void 0, function* () {
        yield helper_1.activateAndPreview(helper_1.getDocUri(docUri));
        assert.strictEqual(fs.existsSync(helper_1.getDocPath(dotUri)), true);
        // cleanup
        fs.unlinkSync(helper_1.getDocPath(dotUri));
    }));
});
function toRange(sLine, sChar, eLine, eChar) {
    const start = new vscode.Position(sLine, sChar);
    const end = new vscode.Position(eLine, eChar);
    return new vscode.Range(start, end);
}
function testDiagnostics(docUri, expectedDiagnostics) {
    return __awaiter(this, void 0, void 0, function* () {
        yield helper_1.activate(docUri);
        const actualDiagnostics = vscode.languages.getDiagnostics(docUri);
        assert.equal(actualDiagnostics.length, expectedDiagnostics.length);
        expectedDiagnostics.forEach((expectedDiagnostic, i) => {
            const actualDiagnostic = actualDiagnostics[i];
            assert.equal(actualDiagnostic.message, expectedDiagnostic.message);
            assert.deepEqual(actualDiagnostic.range, expectedDiagnostic.range);
            assert.equal(actualDiagnostic.severity, expectedDiagnostic.severity);
        });
    });
}
//# sourceMappingURL=cfnlint.test.js.map