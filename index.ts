import * as core from '@actions/core';
import * as request from 'request';
import * as str from 'underscore.string';
import * as fs from 'fs';
import * as path from 'path';

const GITHUB_WORKSPACE = process.env.GITHUB_WORKSPACE;

interface RequestOptions {
    url: string;
    auth: {
        username: string;
        password: string;
    }
}

const getValue = (path: string): string => {
    const value = core.getInput(path);
    if (str.isBlank(value)) {
        const errorMessage = `Parameter '${path}' is required.`;
        core.setFailed(errorMessage);
        throw new Error(errorMessage);
    }

    return value;
}

const login = getValue('login');
const password = getValue('password');
const project = getValue('project');

const baseServiceUrl = `https://nexus-services.mindbox.ru/projects/configuration?projectSystemName=${project}`
const auth = {
    username: login,
    password: password
}

const downloadConfig = (options: RequestOptions, filePath: string): void => {
    core.info(`Requesting '${options.url}'`);

    request.get(options, (error, response, body) => {
        if (response && response.statusCode == 200) {

            fs.writeFileSync(filePath, body);
            core.info(`Project configuration '${filePath}' saved`);
        }
        else {
            const errorMessage = `Error while getting '${options.url}': '${error}', response code: ${response && response.statusCode}`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
    });
}


const environments = getValue('environments');
const configsPath = getValue('configs-path');
const instances = core.getInput('instances');
const splittedEnvironments = environments.split(',');

if (!str.isBlank(instances)) {
    for (const instance of instances.split(',')) {
        for (const environment of splittedEnvironments) {
            const options = {
                url: `${baseServiceUrl}&environment=${environment}&instanceName=${instance}`,
                auth: auth
            };
            const fileName = `application.config.${environment.toLowerCase()}-${instance.toLowerCase()}`;
            const filePath = path.join(`${GITHUB_WORKSPACE}`, configsPath, fileName);
            downloadConfig(options, filePath);
        }
    }
}
else {
    for (const environment of splittedEnvironments) {
        const options = {
            url: `${baseServiceUrl}&environment=${environment}`,
            auth: auth
        };
        const fileName = `application.config.${environment.toLowerCase()}`;
        const filePath = path.join(`${GITHUB_WORKSPACE}`, configsPath, fileName);
        downloadConfig(options, filePath);
    }
}