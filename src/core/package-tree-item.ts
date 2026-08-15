import * as vscode from 'vscode';
import { PackageInfo } from '../models/package-info';

/**
 * TreeItem representing a discovered package.json (workspace root or nested)
 */
export class PackageTreeItem extends vscode.TreeItem {
  constructor(
    public readonly packageInfo: PackageInfo,
    public readonly workspaceFolder: vscode.WorkspaceFolder
  ) {
    const isRoot = packageInfo.relativePath === '.';
    const nestedName = packageInfo.relativePath.split('/').pop();
    const label = isRoot ? workspaceFolder.name : nestedName || packageInfo.relativePath;

    super(label, vscode.TreeItemCollapsibleState.Expanded);

    this.contextValue = 'package';
    this.iconPath = new vscode.ThemeIcon('package');
    this.description = packageInfo.relativePath;
    this.tooltip = `Package: ${label}\nPath: ${packageInfo.dir}`;
  }
}
