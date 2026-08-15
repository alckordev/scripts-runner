import * as vscode from 'vscode';
import { Logger } from './utils/logger';
import { ConfigurationService } from './services/configuration-service';
import { PackageJsonReader } from './services/package-json-reader';
import { PackageScanner } from './services/package-scanner';
import { StatusBarService } from './services/status-bar-service';
import { PackageManagerDetector } from './core/package-manager-detector';
import { ScriptExecutor } from './core/script-executor';
import { ScriptsProvider } from './core/scripts-provider';
import { FileWatcher } from './core/file-watcher';
import { CommandRegistry } from './commands/command-registry';
import { RunScriptCommand } from './commands/run-script-command';
import { RefreshCommand } from './commands/refresh-command';
import { OpenPackageJsonCommand } from './commands/open-package-json-command';
import { ChangePackageManagerCommand } from './commands/change-package-manager-command';

/**
 * Activates the extension
 */
export function activate(context: vscode.ExtensionContext): void {
  Logger.initialize();
  Logger.info('Quick Scripts Runner activated');

  // 1. Create base services
  const configService = new ConfigurationService();
  const packageJsonReader = new PackageJsonReader();
  const packageScanner = new PackageScanner(packageJsonReader, configService);
  const statusBarService = new StatusBarService();

  // 2. Create core components with dependency injection
  const packageManagerDetector = new PackageManagerDetector(configService);
  const scriptExecutor = new ScriptExecutor();
  const scriptsProvider = new ScriptsProvider(packageScanner, packageManagerDetector);

  // 3. Create TreeView
  const treeView = vscode.window.createTreeView('quickScriptsRunnerExplorer', {
    treeDataProvider: scriptsProvider,
  });

  context.subscriptions.push(treeView);

  // 4. Initialize StatusBar with active workspace
  const updateStatusBar = (): void => {
    let activeWorkspace: vscode.WorkspaceFolder | undefined;

    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor?.document.uri) {
      activeWorkspace = vscode.workspace.getWorkspaceFolder(activeEditor.document.uri);
    }

    if (!activeWorkspace) {
      activeWorkspace = vscode.workspace.workspaceFolders?.[0];
    }

    if (activeWorkspace && packageJsonReader.exists(activeWorkspace.uri.fsPath)) {
      const packageManager = packageManagerDetector.detect(activeWorkspace.uri.fsPath);
      statusBarService.update(packageManager);
    } else {
      statusBarService.hide();
    }
  };

  updateStatusBar();

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => {
      updateStatusBar();
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('quickScriptsRunner')) {
        scriptsProvider.refresh();
        updateStatusBar();
      }
    })
  );

  // 5. Initialize FileWatcher
  const fileWatcher = new FileWatcher(scriptsProvider, statusBarService, packageManagerDetector);
  fileWatcher.start();
  context.subscriptions.push({ dispose: () => fileWatcher.dispose() });

  // 6. Create and register commands
  const commandRegistry = new CommandRegistry();

  const commands = [
    new RunScriptCommand(scriptExecutor, packageManagerDetector, packageScanner),
    new RefreshCommand(scriptsProvider),
    new OpenPackageJsonCommand(packageScanner),
    new ChangePackageManagerCommand(configService, scriptsProvider, statusBarService),
  ];

  commandRegistry.registerAll(commands, context);

  // 7. Add disposables
  context.subscriptions.push(statusBarService);

  Logger.info('Quick Scripts Runner initialized successfully');
}

/**
 * Deactivates the extension
 */
export function deactivate(): void {
  Logger.info('Quick Scripts Runner deactivated');
  Logger.dispose();
}
