import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ICommand } from '../models/command';
import { IPackageScanner } from '../services/package-scanner';
import { PackageTreeItem } from '../core/package-tree-item';
import { ScriptTreeItem } from '../core/script-tree-item';
import { Logger } from '../utils/logger';

interface PackageQuickPickItem extends vscode.QuickPickItem {
  packageDir: string;
}

/**
 * Command to open or create package.json
 */
export class OpenPackageJsonCommand implements ICommand {
  readonly id = 'quickScriptsRunner.openPackageJson';

  constructor(private readonly packageScanner: IPackageScanner) {}

  /**
   * Opens package.json for a tree item, or lets the user pick a package
   */
  async execute(item?: unknown): Promise<void> {
    const packageDirFromItem = this.resolvePackageDirFromItem(item);
    if (packageDirFromItem) {
      await this.openOrCreate(packageDirFromItem);
      return;
    }

    const packages = await this.collectPackages();

    if (packages.length === 1) {
      await this.openOrCreate(packages[0].packageDir);
      return;
    }

    if (packages.length > 1) {
      const selected = await vscode.window.showQuickPick(packages, {
        placeHolder: 'Select a package.json to open',
        matchOnDescription: true,
      });

      if (!selected) {
        return;
      }

      await this.openOrCreate(selected.packageDir);
      return;
    }

    const fallbackWorkspace = vscode.workspace.workspaceFolders?.[0];
    if (!fallbackWorkspace) {
      vscode.window.showErrorMessage('No workspace open');
      return;
    }

    await this.openOrCreate(fallbackWorkspace.uri.fsPath);
  }

  /**
   * Resolves a package directory from a tree item argument
   */
  private resolvePackageDirFromItem(item: unknown): string | undefined {
    if (item instanceof PackageTreeItem) {
      return item.packageInfo.dir;
    }

    if (item instanceof ScriptTreeItem) {
      return item.script.packageDir;
    }

    return undefined;
  }

  /**
   * Collects discovered packages across all workspace folders
   */
  private async collectPackages(): Promise<PackageQuickPickItem[]> {
    const folders = vscode.workspace.workspaceFolders ?? [];
    const items: PackageQuickPickItem[] = [];

    for (const folder of folders) {
      const packages = await this.packageScanner.findPackages(folder);

      for (const pkg of packages) {
        items.push({
          label: pkg.relativePath === '.' ? folder.name : path.basename(pkg.dir),
          description: pkg.relativePath,
          packageDir: pkg.dir,
        });
      }
    }

    return items;
  }

  /**
   * Opens package.json in the given directory, offering to create it when missing
   */
  private async openOrCreate(packageDir: string): Promise<void> {
    const packageJsonPath = path.join(packageDir, 'package.json');

    if (fs.existsSync(packageJsonPath)) {
      const document = await vscode.workspace.openTextDocument(packageJsonPath);
      await vscode.window.showTextDocument(document);
      Logger.info(`package.json opened from: ${packageDir}`);
      return;
    }

    const result = await vscode.window.showInformationMessage(
      `package.json not found in ${packageDir}. Do you want to create one?`,
      'Create'
    );

    if (result === 'Create') {
      await this.createPackageJson(packageDir);
    }
  }

  /**
   * Creates a basic package.json
   */
  private async createPackageJson(packageDir: string): Promise<void> {
    try {
      const packageName = path.basename(packageDir);
      const packageJson = {
        name: packageName.toLowerCase().replace(/\s+/g, '-'),
        version: '1.0.0',
        scripts: {
          start: "echo 'Add your commands here'",
        },
      };

      const packageJsonPath = path.join(packageDir, 'package.json');
      await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');

      const document = await vscode.workspace.openTextDocument(packageJsonPath);
      await vscode.window.showTextDocument(document);

      vscode.window.showInformationMessage('package.json created successfully');
      Logger.info('package.json created');
    } catch (error) {
      Logger.error('Error creating package.json', error as Error);
      vscode.window.showErrorMessage('Error creating package.json');
    }
  }
}
