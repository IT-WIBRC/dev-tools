#!/usr/bin/env node

import { select, input } from '@inquirer/prompts';
import { ProgrammingLanguage } from './config.js';
import { scaffoldNodejsProject } from './scaffolding/nodejs.js';
import chalk from 'chalk';

async function main() {
  try {
    const projectName = await input({
      message: 'What is the name of your new project?',
      default: 'my-devkit-project',
    });

    const projectDescription = await input({
      message: 'Provide a short description for your project:',
      default: 'A project scaffolded with DevKit.',
    });

    const language = await select({
      message: 'Choose your programming language:',
      choices: Object.values(ProgrammingLanguage).map((value) => ({ name: value, value })),
    });

    switch (language) {
      case ProgrammingLanguage.Nodejs:
        await scaffoldNodejsProject(projectName, projectDescription);
        break;
    }
  } catch (error) {
    console.error(chalk.red('\nCLI operation cancelled. Exiting.'));
    process.exit(1);
  }
}

main();
