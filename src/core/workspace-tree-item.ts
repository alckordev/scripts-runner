import * as vscode from 'vscode';

/**
 * TreeItem to represent a workspace folder
 */
export class WorkspaceTreeItem extends vscode.TreeItem {
  constructor(public readonly workspaceFolder: vscode.WorkspaceFolder) {
    super(workspaceFolder.name, vscode.TreeItemCollapsibleState.Expanded);
    this.contextValue = 'workspace';
    this.iconPath = new vscode.ThemeIcon('folder');
    this.tooltip = `Workspace: ${workspaceFolder.name}\nPath: ${workspaceFolder.uri.fsPath}`;
  }
}
