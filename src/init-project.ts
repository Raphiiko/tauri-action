import { writeFileSync } from 'fs';
import { join } from 'path';

import { execCommand, getConfig, getPackageJson, getTauriDir } from './utils';

import type { Application, BuildOptions, Info, Runner } from './types';

export async function initProject(
  root: string,
  runner: Runner,
  info: Info,
  { iconPath, bundleIdentifier }: BuildOptions
): Promise<Application> {
  const packageJson = getPackageJson(root);
  const tauriPath = getTauriDir(root);

  await execCommand(
    runner.runnerCommand,
    [...runner.runnerArgs, 'init', '--ci', '--app-name', info.name],
    {
      cwd: root,
    }
  );

  if (tauriPath === null) {
    console.error('Failed to resolve Tauri path');
    process.exit(1);
  }
  const configPath = join(tauriPath, 'tauri.conf.json');
  const config = getConfig(configPath);

  console.log(
    `Replacing tauri.conf.json config - package.version=${info.version}`
  );
  const pkgConfig = {
    ...config.package,
    version: info.version,
  };
  if (packageJson?.productName) {
    console.log(
      `Replacing tauri.conf.json config - package.productName=${packageJson.productName}`
    );
    pkgConfig.productName = packageJson.productName;
  }
  config.package = pkgConfig;

  if (bundleIdentifier) {
    console.log(
      `Replacing tauri.conf.json config - tauri.bundle.identifier=${bundleIdentifier}`
    );
    config.tauri = {
      ...config.tauri,
      bundle: {
        ...config.tauri?.bundle,
        identifier: bundleIdentifier,
      },
    };
  }

  writeFileSync(configPath, JSON.stringify(config, null, 2));

  const app = {
    tauriPath,
    runner,
    name: info.name,
    version: info.version,
    wixLanguage: info.wixLanguage,
  };

  if (iconPath) {
    await execCommand(
      runner.runnerCommand,
      [...runner.runnerArgs, 'icon', join(root, iconPath)],
      {
        cwd: root,
      }
    );
  }

  return app;
}
