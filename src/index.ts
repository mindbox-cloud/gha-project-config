import * as core from '@actions/core';
import fetch, { RequestInit } from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';

const GITHUB_WORKSPACE = process.env.GITHUB_WORKSPACE;

async function downloadConfig(url: string, options: RequestInit, filePath: string): Promise<void> {
  core.info(`Requesting '${url}'`);

  try {
    const result = await fetch(url, options);

    if (result.ok) {
      fs.writeFileSync(filePath, await result.text());
      core.info(`Project configuration '${filePath}' saved`);
    } else {
      throw new Error('response code: ' + result.statusText);
    }
  } catch (error) {
    const errorMessage = `Error while getting '${url}': '${error}`;
    core.setFailed(errorMessage);

    throw new Error(errorMessage);
  }
}

async function run(): Promise<void> {
  const login = core.getInput('login', { required: true });
  const password = core.getInput('password', { required: true });
  const project = core.getInput('project', { required: true });
  const environments = core.getInput('environments', { required: true });
  const configsPath = core.getInput('configs-path', { required: true });
  const instances = core.getInput('instances');

  const baseServiceUrl = `https://nexus-services.mindbox.ru/projects/configuration?projectSystemName=${project}`;

  const options = {
    method: 'get',
    headers: {
      Authorization: 'Basic ' + Buffer.from(login + ':' + password).toString('base64'),
    },
  };

  const splittedEnvironments = environments.split(',');

  if (instances.length !== 0) {
    for (const instance of instances.split(',')) {
      for (const environment of splittedEnvironments) {
        const url = `${baseServiceUrl}&environment=${environment}&instanceName=${instance}`;
        const fileName = `application.config.${environment.toLowerCase()}-${instance.toLowerCase()}`;
        const filePath = path.join(`${GITHUB_WORKSPACE}`, configsPath, fileName);
        await downloadConfig(url, options, filePath);
      }
    }
  } else {
    for (const environment of splittedEnvironments) {
      const url = `${baseServiceUrl}&environment=${environment}`;
      const fileName = `application.config.${environment.toLowerCase()}`;
      const filePath = path.join(`${GITHUB_WORKSPACE}`, configsPath, fileName);
      await downloadConfig(url, options, filePath);
    }
  }
}

run();
