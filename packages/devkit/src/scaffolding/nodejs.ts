import { select } from '@inquirer/prompts';
import {
  NodejsFramework,
  UnitTestingLibrary,
  E2ELibrary,
  PackageManagers,
 type ValuesOf
} from '../config.js';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import type { Ora } from 'ora';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execa } from 'execa';

interface ScaffoldingOptions {
  projectName: string;
  projectDescription: string;
  framework: ValuesOf<typeof NodejsFramework>;
  unitTestLibrary: ValuesOf<typeof UnitTestingLibrary>;
  e2eLibrary: ValuesOf<typeof E2ELibrary> | null;
  packageManager: ValuesOf<typeof PackageManagers>;
}

const frontendFrameworks: (ValuesOf<typeof NodejsFramework>)[] = [
  NodejsFramework.Vue,
  NodejsFramework.Nuxt
];

async function getFrameworkAndTestingPrompts(): Promise<Partial<ScaffoldingOptions>> {
  const framework = await select({
    message: 'Which Node.js framework would you like to use?',
    choices: Object.values(NodejsFramework).map((value) => ({ name: value, value })),
  });

  const unitTestLibrary = await select({
    message: 'Choose a unit testing library:',
    choices: Object.values(UnitTestingLibrary).map((value) => ({ name: value, value })),
  });

  let e2eLibrary: ValuesOf<typeof E2ELibrary> | null = null;
  const isFrontend = frontendFrameworks.includes(framework);
  if (isFrontend) {
    e2eLibrary = await select({
      message: 'Choose an End-to-End (E2E) testing library:',
      choices: Object.values(E2ELibrary).map((value) => ({ name: value, value })),
    });
  }

  const packageManager = await select({
    message: 'Which package manager would you like to use?',
    choices: Object.values(PackageManagers).map((value) => ({ name: value, value })),
  });

  return { framework, unitTestLibrary, e2eLibrary, packageManager };
}

async function copyTemplate(options: ScaffoldingOptions, spinner: Ora) {
  const currentFileUrl = import.meta.url;
  const currentDirPath = dirname(fileURLToPath(currentFileUrl));

  const sourceTemplateDir = path.join(
    currentDirPath,
    '..',
    '..',
    '..',
    'templates',
    'nodejs',
    options.framework.toLowerCase().replace('.', '')
  );
  const destinationDir = path.join(process.cwd(), options.projectName);

  spinner.start(chalk.cyan('Copying project files...'));
  await fs.copy(sourceTemplateDir, destinationDir);
  spinner.succeed(chalk.green('Project files copied successfully!'));
}

async function modifyPackageJson(options: ScaffoldingOptions) {
  const projectPath = path.join(process.cwd(), options.projectName);
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageJsonContent = await fs.readJson(packageJsonPath);

  packageJsonContent.name = options.projectName;
  packageJsonContent.description = options.projectDescription;

  switch (options.unitTestLibrary) {
    case UnitTestingLibrary.Jest:
      packageJsonContent.devDependencies = {
        ...packageJsonContent.devDependencies,
        "jest": "^29.7.0",
        "@types/jest": "^29.5.12",
        "ts-jest": "^29.1.2"
      };
      break;
    case UnitTestingLibrary.Vitest:
      packageJsonContent.devDependencies = {
        ...packageJsonContent.devDependencies,
        "vitest": "^3.2.4"
      };
      break;
  }

  const isFrontend = frontendFrameworks.includes(options.framework);
  if (isFrontend && options.e2eLibrary) {
    switch (options.e2eLibrary) {
      case E2ELibrary.Cypress:
        packageJsonContent.devDependencies = {
          ...packageJsonContent.devDependencies,
          "cypress": "^13.12.0"
        };
        break;
      case E2ELibrary.Playwright:
        packageJsonContent.devDependencies = {
          ...packageJsonContent.devDependencies,
          "@playwright/test": "^1.45.0"
        };
        break;
    }
  }

  await fs.writeJson(packageJsonPath, packageJsonContent, { spaces: 2 });
}

async function installDependencies(options: ScaffoldingOptions, spinner: Ora) {
  const projectPath = path.join(process.cwd(), options.projectName);
  spinner.text = chalk.cyan(`Installing dependencies with ${options.packageManager}...`);
  spinner.start();

  try {
    const installCommand = options.packageManager;
    const installArgs = ['install'];

    await execa(installCommand, installArgs, {
      cwd: projectPath,
      stdio: 'inherit',
    });

    spinner.succeed(chalk.green('Dependencies installed successfully!'));
  } catch (error) {
    spinner.fail(chalk.red('Failed to install dependencies.'));
    console.error(chalk.red('Installation error:'), error);
    throw error;
  }
}

export async function scaffoldNodejsProject(projectName: string, projectDescription: string) {
  const spinner = ora();

  try {
    const specificOptions = await getFrameworkAndTestingPrompts();
    const options = {
      projectName,
      projectDescription,
      ...specificOptions,
    } as ScaffoldingOptions;

    await copyTemplate(options, spinner);
    await modifyPackageJson(options);
    await installDependencies(options, spinner);

    console.log(
      chalk.green(`\n🚀 Successfully created project ${projectName}!`)
    );
    console.log(chalk.cyan(`\nNext steps:`));
    console.log(chalk.cyan(`  cd ${projectName}`));
    console.log(chalk.cyan(`  ${options.packageManager} run dev`));
  } catch (err) {
    spinner.fail(chalk.red('An error occurred during scaffolding.'));
    console.error(err);
  }
}
