import { Script } from '../models/script';
import { IScriptExecutor } from '../core/script-executor';
import { IPackageManagerDetector } from '../core/package-manager-detector';
import { ScriptTreeItem } from '../core/script-tree-item';
import { IPackageScanner } from '../services/package-scanner';
import { ICommand } from '../models/command';
import * as vscode from 'vscode';

interface ScriptQuickPickItem extends vscode.QuickPickItem {
  script: Script;
  workspaceFolder: vscode.WorkspaceFolder;
}

/**
 * Command to execute a script
 */
export class RunScriptCommand implements ICommand {
  readonly id = 'quickScriptsRunner.runScript';

  constructor(
    private readonly scriptExecutor: IScriptExecutor,
    private readonly packageManagerDetector: IPackageManagerDetector,
    private readonly packageScanner: IPackageScanner
  ) {}

  /**
   * Executes the command from the tree view or Command Palette
   */
  async execute(scriptOrItem?: unknown, workspaceFolder?: vscode.WorkspaceFolder): Promise<void> {
    let selectedScript: Script | undefined;
    let activeWorkspace = workspaceFolder;

    if (scriptOrItem instanceof ScriptTreeItem) {
      selectedScript = scriptOrItem.script;
      activeWorkspace = scriptOrItem.workspaceFolder ?? workspaceFolder;
    } else if (this.isScript(scriptOrItem)) {
      selectedScript = scriptOrItem;
    }

    if (!selectedScript) {
      const picked = await this.pickScript();
      if (!picked) {
        return;
      }
      selectedScript = picked.script;
      activeWorkspace = picked.workspaceFolder;
    }

    if (!activeWorkspace) {
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor?.document.uri) {
        activeWorkspace = vscode.workspace.getWorkspaceFolder(activeEditor.document.uri);
      }
    }

    if (!activeWorkspace) {
      activeWorkspace = vscode.workspace.workspaceFolders?.[0];
    }

    if (!activeWorkspace) {
      vscode.window.showErrorMessage('No workspace open');
      return;
    }

    const packageDir = selectedScript.packageDir || activeWorkspace.uri.fsPath;
    const packageManager = this.packageManagerDetector.detect(
      packageDir,
      activeWorkspace.uri.fsPath
    );

    this.scriptExecutor.execute(selectedScript, packageManager, activeWorkspace);
  }

  /**
   * Shows a QuickPick of all discovered scripts across packages
   */
  private async pickScript(): Promise<ScriptQuickPickItem | undefined> {
    const items = await this.collectScriptPicks();

    if (items.length === 0) {
      vscode.window.showInformationMessage('No scripts found in this workspace');
      return undefined;
    }

    return vscode.window.showQuickPick(items, {
      placeHolder: 'Select a script to run',
      matchOnDescription: true,
      matchOnDetail: true,
    });
  }

  /**
   * Collects QuickPick items for every script in every discovered package
   */
  private async collectScriptPicks(): Promise<ScriptQuickPickItem[]> {
    const folders = vscode.workspace.workspaceFolders ?? [];
    const items: ScriptQuickPickItem[] = [];

    for (const folder of folders) {
      const packages = await this.packageScanner.findPackages(folder);

      for (const pkg of packages) {
        if (pkg.scripts.length === 0) {
          continue;
        }

        const packageManager = this.packageManagerDetector.detect(pkg.dir, folder.uri.fsPath);
        const packageLabel = pkg.relativePath === '.' ? folder.name : pkg.relativePath;

        for (const script of pkg.scripts) {
          items.push({
            label: script.name,
            description: `${packageManager} run ${script.name}`,
            detail: packageLabel,
            script,
            workspaceFolder: folder,
          });
        }
      }
    }

    return items;
  }

  /**
   * Type guard for Script arguments coming from the tree view
   */
  private isScript(value: unknown): value is Script {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as Script;
    return typeof candidate.name === 'string' && typeof candidate.command === 'string';
  }
}
