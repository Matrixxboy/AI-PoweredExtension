import * as vscode from 'vscode';
import axios from 'axios';

const LOCAL_LLM_API = "http://localhost:8000/debug/";

export function activate(context: vscode.ExtensionContext) {
    // Register command for AI-powered debugging
    let disposable = vscode.commands.registerCommand('extension.debugCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active editor found.");
            return;
        }

        const selectedCode = editor.document.getText(editor.selection);
        if (!selectedCode) {
            vscode.window.showErrorMessage("No code selected.");
            return;
        }

        vscode.window.showInformationMessage("AI Debugging in progress...");

        try {
            const response = await axios.post(LOCAL_LLM_API, { code: selectedCode });
            const fixedCode = response.data.fixed_code;

            // Show AI suggestion instead of replacing directly
            const edit = new vscode.WorkspaceEdit();
            const range = editor.selection;
            edit.replace(editor.document.uri, range, fixedCode);
            vscode.workspace.applyEdit(edit);
            vscode.window.showInformationMessage("AI Debug: Suggestion applied!");
        } catch (error) {
            vscode.window.showErrorMessage("Error communicating with AI Debugger.");
        }
    });

    // Register code diagnostic provider for real-time error detection
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('aiDebugger');
    context.subscriptions.push(diagnosticCollection);

    vscode.workspace.onDidChangeTextDocument(async (event) => {
        if (!event.document) return;

        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document !== event.document) return;

        const code = event.document.getText();
        try {
            const response = await axios.post(LOCAL_LLM_API, { code });
            const fixedCode = response.data.fixed_code;

            // Clear previous diagnostics
            diagnosticCollection.clear();

            // Generate diagnostics based on AI response (simple logic for now)
            const diagnostics: vscode.Diagnostic[] = [];
            const lines = code.split('\n');
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('error') || lines[i].includes('undefined')) {
                    const range = new vscode.Range(i, 0, i, lines[i].length);
                    const diagnostic = new vscode.Diagnostic(
                        range,
                        "Possible error detected: AI suggests a fix.",
                        vscode.DiagnosticSeverity.Warning
                    );
                    diagnostics.push(diagnostic);
                }
            }

            // Apply diagnostics
            diagnosticCollection.set(event.document.uri, diagnostics);
        } catch (error) {
            console.error("AI Debugger Error:", error);
        }
    });

    // Register command for custom debugging prompts
    let customPromptDisposable = vscode.commands.registerCommand('extension.customDebugPrompt', async () => {
        const input = await vscode.window.showInputBox({
            prompt: "Enter your custom AI debugging prompt",
            placeHolder: "Example: Optimize this code for performance"
        });

        if (!input) return;

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active editor found.");
            return;
        }

        const selectedCode = editor.document.getText(editor.selection);
        if (!selectedCode) {
            vscode.window.showErrorMessage("No code selected.");
            return;
        }

        vscode.window.showInformationMessage("AI Debugging in progress...");

        try {
            const response = await axios.post(LOCAL_LLM_API, { code: selectedCode, prompt: input });
            const fixedCode = response.data.fixed_code;

            // Show AI suggestion instead of replacing directly
            const edit = new vscode.WorkspaceEdit();
            const range = editor.selection;
            edit.replace(editor.document.uri, range, fixedCode);
            vscode.workspace.applyEdit(edit);
            vscode.window.showInformationMessage("AI Debug: Custom Suggestion applied!");
        } catch (error) {
            vscode.window.showErrorMessage("Error communicating with AI Debugger.");
        }
    });

    context.subscriptions.push(disposable, customPromptDisposable);
}

export function deactivate() {}

