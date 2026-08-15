import * as vscode from 'vscode';
import { Script } from '../models/script';
import { PackageManager, PACKAGE_MANAGER_INFO } from '../models/package-manager';

/**
 * Custom TreeItem to display scripts in the sidebar
 */
export class ScriptTreeItem extends vscode.TreeItem {
  constructor(
    public readonly script: Script,
    public readonly packageManager: PackageManager,
    public readonly workspaceFolder?: vscode.WorkspaceFolder
  ) {
    super(script.name, vscode.TreeItemCollapsibleState.None);

    const info = PACKAGE_MANAGER_INFO[packageManager];
    const fullCommand = `${packageManager} run ${script.name}`;
    const truncatedCommand =
      script.command.length > 30 ? `${script.command.substring(0, 27)}...` : script.command;

    const packageLabel =
      script.relativePath && script.relativePath !== '.'
        ? script.relativePath
        : workspaceFolder?.name;
    const packageInfo = packageLabel ? `\nPackage: ${packageLabel}` : '';

    this.tooltip = `${info.icon} ${fullCommand}${packageInfo}\n\nCommand: ${script.command}`;
    this.description = truncatedCommand;
    this.iconPath = new vscode.ThemeIcon('run');
    this.contextValue = 'script';
    this.command = {
      command: 'quickScriptsRunner.runScript',
      title: 'Run Script',
      arguments: [script, workspaceFolder],
    };
  }
}
