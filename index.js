"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const request = __importStar(require("request"));
const str = __importStar(require("underscore.string"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const GITHUB_WORKSPACE = process.env.GITHUB_WORKSPACE;
const getValue = (path) => {
    const value = core.getInput(path);
    if (str.isBlank(value)) {
        const errorMessage = `Parameter '${path}' is required.`;
        core.setFailed(errorMessage);
        throw new Error(errorMessage);
    }
    return value;
};
const login = getValue('login');
const password = getValue('password');
const project = getValue('project');
const baseServiceUrl = `https://nexus-services.directcrm.ru/projects/configuration?projectSystemName=${project}`;
const auth = {
    username: login,
    password: password
};
const downloadConfig = (options, filePath) => {
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
};
const environments = getValue('environments');
const configsPath = getValue('configs-path');
const instances = core.getInput('instances');
const splittedEnvironments = environments.split(',');
if (!str.isBlank(instances)) {
    for (const instance of instances.split(',')) {
        for (const environment of splittedEnvironments) {
            const options = {
                url: `${baseServiceUrl}&environment=${environment}&instance=${instance}`,
                auth: auth
            };
            const fileName = `application.config.${str.decapitalize(environment)}-${str.decapitalize(instance)}`;
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
        const fileName = `application.config.${str.decapitalize(environment)}`;
        const filePath = path.join(`${GITHUB_WORKSPACE}`, configsPath, fileName);
        downloadConfig(options, filePath);
    }
}
//# sourceMappingURL=index.js.map