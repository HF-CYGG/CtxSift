# Changelog

## Unreleased

- 发布脚本幂等性：`release:publish` 的 `gh` CLI 路径在 Release 已存在时与 API 路径保持一致，返回现有 Release URL 并成功退出，避免同版本复核被误判为失败。
- 测试覆盖：新增发布脚本回归测试，覆盖 `gh release view` 已存在且不得再次执行 `gh release create` 的场景。
- 同步范围保护：新增忽略规则与回归测试，确保根目录遗留 `benchmark-report.md/json`、本地规则文件与临时测试产物不进入同步范围。
- 打包范围保护：`pack:dry-run` 解析 `npm pack --dry-run --json` 文件清单，拒绝本地规则、临时文件与根目录 legacy benchmark report 进入 npm 包，并避免通过 shell 启动 npm。
- 打包系统与编辑器临时产物防护：`pack:dry-run` 现在会拒绝 `.DS_Store`、`Thumbs.db`、Vim swap 文件与编辑器备份文件进入 npm 包，减少非主线本地产物泄漏。
- 打包敏感文件防护：`pack:dry-run` 现在会拒绝 `.env` 与 `.env.*` 文件进入 npm 包，补齐发布包层面的敏感配置泄漏防线。
- 打包 direnv 防护：`pack:dry-run` 现在会拒绝 `.envrc` 进入 npm 包，避免本地 shell 环境导出文件泄漏。
- 打包密钥文件防护：`pack:dry-run` 现在会拒绝常见私钥与证书容器文件（如 `id_rsa`、`.pem`、`.key`、`.p12`、`.pfx`）进入 npm 包。
- 打包 Java 密钥库防护：`pack:dry-run` 现在会拒绝 `.jks`、`.jceks` 与 `.keystore` 文件进入 npm 包，降低 Java keystore/truststore 中私钥或凭据泄漏风险。
- 打包移动端签名凭据防护：`pack:dry-run` 现在会拒绝 `.p8`、`.mobileprovision` 与 `.provisionprofile` 文件进入 npm 包，降低 Apple AuthKey 与 provisioning profile 泄漏风险。
- 打包 Firebase 移动端应用配置防护：`pack:dry-run` 现在会拒绝 `google-services.json` 与 `GoogleService-Info.plist` 进入 npm 包，降低移动端 Firebase 应用配置误打包风险。
- 打包 Android 签名属性防护：`pack:dry-run` 现在会拒绝 `android/key.properties`、`android/keystore.properties` 与 `android/signing.properties` 进入 npm 包，降低 Android/Flutter 签名密码误打包风险。
- 打包 Android/Flutter 本地属性防护：`pack:dry-run` 现在会拒绝 `local.properties` 进入 npm 包，降低本机 SDK 路径和本地签名配置引用误打包风险。
- 打包 GnuPG/PGP 私钥防护：`pack:dry-run` 现在会拒绝 `secring.gpg`、`private-key.asc`、`secret-key.asc` 与 `private.pgp` 进入 npm 包，降低私钥导出文件泄漏风险。
- 打包密码管理器 vault 防护：`pack:dry-run` 现在会拒绝 `.kdbx`、`.opvault` 与 `.agilekeychain` 进入 npm 包，降低本地密码库误打包风险。
- 打包本地密钥容器防护：`pack:dry-run` 现在会拒绝 `.ppk`、`.keychain-db` 与 `.keychain` 进入 npm 包，降低 PuTTY 私钥和 macOS Keychain 文件泄漏风险。
- 打包认证配置防护：`pack:dry-run` 现在会拒绝 `.npmrc`、`.yarnrc`、`.yarnrc.yml` 与 `.pnpmrc` 进入 npm 包，降低 registry token 泄漏风险。
- 打包 Ruby 包管理器凭据防护：`pack:dry-run` 现在会拒绝 `.gem/credentials` 与 `.bundle/config` 进入 npm 包，降低 RubyGems/Bundler 本地凭据泄漏风险。
- 打包跨语言发布凭据防护：`pack:dry-run` 现在会拒绝 `.pypirc` 与 `credentials.toml` 进入 npm 包，降低 PyPI/Cargo 发布凭据泄漏风险。
- 打包跨生态认证配置防护：`pack:dry-run` 现在会拒绝 `auth.json` 与 `NuGet.Config` 进入 npm 包，降低 Composer/NuGet registry 凭据泄漏风险。
- 打包 JVM 仓库认证防护：`pack:dry-run` 现在会拒绝 `.m2/settings.xml` 与 `.gradle/gradle.properties` 进入 npm 包，降低 Maven/Gradle 仓库凭据泄漏风险。
- 打包 Gradle 项目属性防护：`pack:dry-run` 现在会拒绝项目内任意 `gradle.properties` 进入 npm 包，降低 Android 签名密码、Maven token 或本地代理凭据误打包风险。
- 打包凭据文件防护：`pack:dry-run` 现在会拒绝 `.netrc`、`credentials.json` 与 `credential.json` 进入 npm 包，降低通用凭据文件泄漏风险。
- 打包带前缀凭据文件防护：`pack:dry-run` 现在会拒绝 `*-credentials.json`、`*_credentials.json` 与 `*.credentials.json` 进入 npm 包，降低 Play Store、部署平台或第三方服务凭据误打包风险。
- 打包 OAuth client secret 防护：`pack:dry-run` 现在会拒绝 `client_secret*.json`、`client-secret(s).json` 与 `*-client-secret(s).json` 进入 npm 包，降低 Google OAuth 客户端密钥误打包风险。
- 打包云凭据防护：`pack:dry-run` 现在会拒绝 `.aws/credentials` 与 `application_default_credentials.json` 等云 SDK 凭据文件进入 npm 包。
- 打包云 CLI token 缓存防护：`pack:dry-run` 现在会拒绝 `.azure/accessTokens.json`、`.azure/msal_token_cache.json`、`.config/gcloud/credentials.db` 与 `.config/gcloud/access_tokens.db` 进入 npm 包，降低云 CLI 登录 token 泄漏风险。
- 打包部署平台 CLI 凭据防护：`pack:dry-run` 现在会拒绝 `.vercel/auth.json`、`.netlify/config.json`、`.config/heroku/auth.json` 与 `.config/heroku/accounts.json` 进入 npm 包，降低部署平台登录态泄漏风险。
- 打包 CLI 工具凭据缓存防护：`pack:dry-run` 现在会拒绝 `.sentryclirc`、`.config/configstore/snyk.json` 与 `.config/configstore/firebase-tools.json` 进入 npm 包，降低第三方 CLI token 泄漏风险。
- 打包 Sentry properties 防护：`pack:dry-run` 现在会拒绝 `sentry.properties` 进入 npm 包，降低移动端 source map 上传 token 误打包风险。
- 打包 Docker 凭据防护：`pack:dry-run` 现在会拒绝 `.docker/config.json` 进入 npm 包，降低 Docker registry 认证配置泄漏风险。
- 打包 SSH 配置防护：`pack:dry-run` 现在会拒绝 `.ssh/config` 进入 npm 包，降低 SSH 主机、跳板机与密钥路径配置泄漏风险。
- 打包 Kubernetes 配置防护：`pack:dry-run` 现在会拒绝 `.kube/config` 进入 npm 包，降低 Kubernetes 集群凭据与上下文配置泄漏风险。
- 打包 Git 配置防护：`pack:dry-run` 现在会拒绝 `.git/config` 进入 npm 包，降低带凭据远程地址或仓库本地配置泄漏风险。
- 打包 Git 用户凭据防护：`pack:dry-run` 现在会拒绝 `.git-credentials` 与 `.gitconfig` 进入 npm 包，降低用户级 Git 凭据和配置泄漏风险。
- 打包 GitHub CLI 凭据防护：`pack:dry-run` 现在会拒绝 `.config/gh/hosts.yml` 与 `.config/gh/hosts.yaml` 进入 npm 包，降低 GitHub CLI 登录 token 泄漏风险。
- 打包 Terraform 产物防护：`pack:dry-run` 现在会拒绝 `*.tfvars`、`*.tfvars.json`、`*.tfstate` 与 `*.tfstate.backup` 进入 npm 包，降低 IaC 变量与状态文件泄漏风险。
- 打包 HashiCorp CLI 凭据防护：`pack:dry-run` 现在会拒绝 `.terraformrc`、`terraform.rc`、`.terraform.d/credentials.tfrc.json` 与 `.vault-token` 进入 npm 包，降低 Terraform Cloud 与 Vault token 泄漏风险。
- 打包 token/secret 文件防护：`pack:dry-run` 现在会拒绝常见 `token(s)` 与 `secret(s)` JSON/YAML 文件进入 npm 包，降低生成密钥或令牌文件泄漏风险。
- 打包带前缀 token/secret 文件防护：`pack:dry-run` 现在会拒绝 `*.token(s).json` 与 `*.secret(s).json/yaml/yml` 进入 npm 包，降低按环境命名的密钥文件误打包风险。
- 打包服务账号凭据防护：`pack:dry-run` 现在会拒绝 `service-account.json` 与 `service_account.json` 进入 npm 包，降低服务账号凭据泄漏风险。
- 打包 Firebase/GCP 服务账号变体防护：`pack:dry-run` 现在会拒绝 `serviceAccountKey.json`、`gcp-service-account.json` 与 `*-firebase-adminsdk*.json` 进入 npm 包，降低云服务账号私钥误打包风险。
- 打包敏感文件大小写防护：`pack:dry-run` 的敏感文件匹配现在大小写不敏感，避免 `.ENV`、`CLIENT.PEM` 等大小写变体绕过发布包检查。
- 审计脚本稳定性：`audit:high` 改为无 shell 调用 npm/pnpm，支持显式命令前缀，并在 Windows 下解析 pnpm shim 直接运行实际 CLI 入口，降低沙箱 `spawn` 失败概率。
- 基准 fixture 校验：`bench:fixtures` 现在同时校验动态 PR diff benchmark 所需的 `tests/fixtures/pr-review` 源目录，确保“6 个 benchmark fixtures”声明与实际校验一致。
- 发布命令预览：`release:publish:print-command` 现在会对包含空格的参数加引号，确保生成的 GitHub Release 命令可直接复制执行。
- E2E 临时资源清理：`test:e2e` 的动态 diff 仓库场景现在通过 `finally` 清理临时 Git 仓库，减少重复验证后的本机临时目录残留。
- 打包临时文件防护：`pack:dry-run` 现在会拦截任意路径段中的 `_tmp_*`、`.npm-cache*` 和 `tmp-npm-cache`，防止嵌套临时目录进入 npm 包。
- 基准临时资源清理：`bench:report` 的动态 PR diff benchmark 仓库现在通过 `finally` 清理，避免报告生成中途失败后残留 `ctxsift-bench-pr-*` 临时仓库。
- 发布仓库地址兼容：GitHub Release helper 现在支持 npm 常见的 `git+https://github.com/owner/repo.git`、`github:owner/repo` 与 `git@github.com:owner/repo.git` repository URL，API 发布路径不会因这些格式误判仓库信息缺失。
- 发布仓库地址归一化：带 fragment 的 repository URL（例如 `git+https://github.com/owner/repo.git#main`）现在会正确剥离 `.git` 后缀，避免 API 发布路径将仓库名误判为 `repo.git`。
- 发布命令预览安全性：`release:publish:print-command` 的 formatter 现在会将换行、回车和制表符转义为单行文本，避免复制命令时被隐式拆行。
- 发布命令预览引用：`release:publish:print-command` 现在会引用包含 shell 元字符的参数，并转义 `$` 与反引号，避免复制命令时被 shell 解释为额外语法。
- 发布命令预览单引号：`release:publish:print-command` 现在会引用包含单引号的参数，避免复制命令时被 shell 解释为未闭合字符串。
- 发布命令预览空参数：`release:publish:print-command` 现在会将空字符串参数渲染为 `""`，避免预览命令丢失参数边界。
- 发布仓库地址校验：GitHub Release helper 增加 `ssh://git@github.com/owner/repo.git` 覆盖，并拒绝 scp-style SSH 地址中的嵌套路径，避免生成错误的 API 仓库路径。
- 发布仓库地址片段兼容：GitHub shorthand repository URL（例如 `github:owner/repo.git#release`）现在会正确剥离 fragment 与 `.git` 后缀，避免 API 发布路径使用错误仓库名。
- 发布仓库地址空值防护：GitHub Release helper 现在会拒绝归一化后仓库名为空的 repository URL，避免 API 发布路径生成无效仓库名。

## 1.1.0-alpha.1 - 2026-07-07

### 已实现功能

- 发布边界修正：用 `1.1.0-alpha.1` 承载 `master` 上晚于 `v1.1.0-alpha.0` 的发布收口提交，避免移动已发布 tag。
- 发布脚本收敛：`release:publish:api` 在 release 已存在时返回现有 Release URL 并成功退出，便于同版本闭环复核。
- 基准产物收敛：`bench:report` 仅写入 `benchmarks/benchmark-report.md/json` 主产物，避免根目录旧报告进入同步范围。
- 同步范围收敛：保留本地规则文件和临时文件在忽略范围内，仅同步版本、文档、脚本、测试和主基准证据。

### 未发布功能

- 本次 alpha patch 不新增 CLI 公共能力，不改变输出 schema。

## 1.3.0-alpha.0 - 2026-07-07

- Added a VS Code command example that shells out to the local CtxSift CLI.
- Added a public GitHub-only web demo example that returns CtxSift JSON bundles.
- Added `pnpm test:examples` and included it in `pnpm run release:check`.
- Added release publishing helper `pnpm run release:publish` and `pnpm run release:publish:print-command` for GitHub Release flow.
- Kept root CLI production dependencies unchanged while adding example workflows.

## 1.2.0-alpha.0 - 2026-07-07

- Promoted the artifact-first GitHub Action workflow to the v1.2 alpha boundary.
- Added regression coverage for read-only default workflow permissions and sticky-comment gating.
- Added v1.2 alpha release notes and updated release metadata.

## 1.1.0-alpha.0 - 2026-07-07

### 已实现功能

- 版本边界收口：将版本号固定为 `1.1.0-alpha.0`，并在 README、发布说明、`DEVELOPMENT_STATE.md` 与 `AGENTS.md` 中同步版本信息与发布闭环要求。
- 发布策略收敛：新增并保留 `pnpm run release:publish` 与 `pnpm run release:publish:print-command`，将 GitHub Release 作为版本交付闭环标准步骤。
- 文档与行为一致：对 `docs/github-action.md`、`docs/review-bundle.md`、`docs/benchmark.md` 与 `docs/release-v1.1.0-alpha.0.md` 进行齐套更新，明确 artifact、comment 开关与权限边界。
- 基准复核：新增可复用基准报告输出，记录选中文件数、token 节省率、命中率与安全发现，并同步到 `benchmarks/benchmark-report.md/json`。
- 发布记录模板：更新 `DEVELOPMENT_STATE.md` 为固定里程碑模板，并记录 release:check/audit/pack 命令结果与阻塞原因。

### 未发布功能

- 本次 v1.1.0-alpha 收口不新增教师账号体系或其他业务功能；如有新增能力需在后续版本条目中补齐。

## 1.0.0 - 2026-07-07

- Added installable `ctxsift` CLI.
- Added local directory and public GitHub repository inputs.
- Added question-aware deterministic file ranking with reasons.
- Added diff-aware review bundle mode.
- Added Markdown and JSON schema `1.0` outputs.
- Added token budgeting, dropped-file reasons, and audit summaries.
- Added default redaction for common secret classes and `--no-redact` warning.
- Added GitHub Actions CI and review-bundle workflow example.
- Added unit, integration, CLI E2E, fixture, diff, and security tests.
- Added release gate script covering lint, typecheck, tests, E2E, build, pack dry-run, and high-severity audit.
- Added large-repository metadata caps and selected-output redaction for production-scale repositories.
