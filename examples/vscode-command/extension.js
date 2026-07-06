import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as vscode from "vscode";
import { buildCtxSiftArgs, defaultOutputPath, resolveCtxSiftCommand } from "./ctxsift-command.js";

const execFileAsync = promisify(execFile);

export function activate(context) {
  const disposable = vscode.commands.registerCommand("ctxsift.packWorkspaceContext", async () => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      void vscode.window.showErrorMessage("Open a workspace before running CtxSift.");
      return;
    }

    const ask = await vscode.window.showInputBox({
      prompt: "Question for CtxSift",
      placeHolder: "Where does authentication start?"
    });
    if (!ask) {
      return;
    }

    const outputUri = vscode.Uri.joinPath(workspaceFolder.uri, defaultOutputPath(workspaceFolder.name));
    const command = resolveCtxSiftCommand({
      extensionPath: context.extensionPath,
      workspaceRoot: workspaceFolder.uri.fsPath
    });
    const args = [
      ...command.args,
      ...buildCtxSiftArgs({
        ask,
        outputPath: outputUri.fsPath,
        repo: workspaceFolder.uri.fsPath
      })
    ];

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Packing CtxSift context"
      },
      async () => {
        await execFileAsync(command.command, args, { cwd: workspaceFolder.uri.fsPath });
      }
    );

    const document = await vscode.workspace.openTextDocument(outputUri);
    await vscode.window.showTextDocument(document);
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
