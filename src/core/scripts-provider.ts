import * as vscode from 'vscode';
import { ScriptTreeItem } from './script-tree-item';
import { WorkspaceTreeItem } from './workspace-tree-item';
import { PackageTreeItem } from './package-tree-item';
import { IPackageScanner } from '../services/package-scanner';
import { IPackageManagerDetector } from './package-manager-detector';
import { PackageInfo } from '../models/package-info';
import { Logger } from '../utils/logger';

type TreeItem = ScriptTreeItem | WorkspaceTreeItem | PackageTreeItem;

/**
 * TreeDataProvider to display scripts in the sidebar
 */
export class ScriptsProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> =
    new vscode.EventEmitter<TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private readonly packagesCache = new Map<string, PackageInfo[]>();

  constructor(
    private readonly packageScanner: IPackageScanner,
    private readonly packageManagerDetector: IPackageManagerDetector
  ) {}

  /**
   * Refreshes the tree view and clears the package scan cache
   */
  refresh(): void {
    this.packagesCache.clear();
    this._onDidChangeTreeData.fire();
  }

  /**
   * Gets the active workspace folder based on the active editor
   */
  private getActiveWorkspaceFolder(): vscode.WorkspaceFolder | undefined {
    const activeEditor = vscode.window.activeTextEditor;
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders || workspaceFolders.length === 0) {
      return undefined;
    }

    if (workspaceFolders.length === 1) {
      return workspaceFolders[0];
    }

    if (activeEditor?.document.uri) {
      const activeUri = activeEditor.document.uri;
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(activeUri);
      if (workspaceFolder) {
        return workspaceFolder;
      }
    }

    return workspaceFolders[0];
  }

  /**
   * Returns cached packages for a workspace, scanning when needed
   */
  private async getPackages(workspaceFolder: vscode.WorkspaceFolder): Promise<PackageInfo[]> {
    const cacheKey = workspaceFolder.uri.fsPath;
    const cached = this.packagesCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const packages = await this.packageScanner.findPackages(workspaceFolder);
    this.packagesCache.set(cacheKey, packages);
    return packages;
  }

  /**
   * Packages that actually expose runnable scripts
   */
  private async getPackagesWithScripts(
    workspaceFolder: vscode.WorkspaceFolder
  ): Promise<PackageInfo[]> {
    const packages = await this.getPackages(workspaceFolder);
    return packages.filter((pkg) => pkg.scripts.length > 0);
  }

  /**
   * Converts package scripts into tree items
   */
  private toScriptItems(
    packageInfo: PackageInfo,
    workspaceFolder: vscode.WorkspaceFolder
  ): ScriptTreeItem[] {
    const packageManager = this.packageManagerDetector.detect(
      packageInfo.dir,
      workspaceFolder.uri.fsPath
    );

    return packageInfo.scripts.map(
      (script) => new ScriptTreeItem(script, packageManager, workspaceFolder)
    );
  }

  /**
   * Returns scripts directly when there is a single root package,
   * otherwise a package node per discovered package.json
   */
  private async getPackageOrScriptItems(
    workspaceFolder: vscode.WorkspaceFolder
  ): Promise<TreeItem[]> {
    const packages = await this.getPackagesWithScripts(workspaceFolder);

    if (packages.length === 0) {
      Logger.debug(`No scripts available in ${workspaceFolder.name}`);
      return [];
    }

    if (packages.length === 1 && packages[0].relativePath === '.') {
      return this.toScriptItems(packages[0], workspaceFolder);
    }

    return packages.map((pkg) => new PackageTreeItem(pkg, workspaceFolder));
  }

  /**
   * Gets the child elements of the tree
   */
  async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders || workspaceFolders.length === 0) {
      Logger.debug('No workspace open');
      return [];
    }

    if (element instanceof PackageTreeItem) {
      return this.toScriptItems(element.packageInfo, element.workspaceFolder);
    }

    if (element instanceof WorkspaceTreeItem) {
      return this.getPackageOrScriptItems(element.workspaceFolder);
    }

    if (workspaceFolders.length > 1) {
      const workspaceItems: WorkspaceTreeItem[] = [];

      for (const folder of workspaceFolders) {
        const packages = await this.getPackagesWithScripts(folder);
        if (packages.length > 0) {
          workspaceItems.push(new WorkspaceTreeItem(folder));
        }
      }

      return workspaceItems;
    }

    const activeWorkspace = this.getActiveWorkspaceFolder();
    if (activeWorkspace) {
      return this.getPackageOrScriptItems(activeWorkspace);
    }

    return [];
  }

  /**
   * Gets the parent element
   */
  getParent(element: TreeItem): vscode.ProviderResult<TreeItem> {
    if (element instanceof ScriptTreeItem && element.workspaceFolder) {
      const packages = this.packagesCache.get(element.workspaceFolder.uri.fsPath) ?? [];
      const withScripts = packages.filter((pkg) => pkg.scripts.length > 0);
      const showPackageNodes = !(withScripts.length === 1 && withScripts[0].relativePath === '.');

      if (showPackageNodes) {
        const packageInfo: PackageInfo = {
          dir: element.script.packageDir,
          relativePath: element.script.relativePath,
          scripts: [],
        };
        return new PackageTreeItem(packageInfo, element.workspaceFolder);
      }

      const folders = vscode.workspace.workspaceFolders;
      if (folders && folders.length > 1) {
        return new WorkspaceTreeItem(element.workspaceFolder);
      }
    }

    if (element instanceof PackageTreeItem) {
      const folders = vscode.workspace.workspaceFolders;
      if (folders && folders.length > 1) {
        return new WorkspaceTreeItem(element.workspaceFolder);
      }
    }

    return null;
  }

  /**
   * Gets the tree item representation
   */
  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }
}
