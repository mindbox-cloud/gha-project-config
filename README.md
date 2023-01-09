# gha-project-config

GitHub Action for downloading the project application configuration files from Nexus.

Configuration files are placed at `${GITHUB_WORKSPACE}/{configs-path}` folder.

File naming convention is `application.config.{environment}`.

For example, `application.config.staging`.
