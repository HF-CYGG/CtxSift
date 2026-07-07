# Development State

## 当前里程碑

- v1.1.0-alpha.1 continuous optimization
- 当前目标：用新 alpha patch 承载晚于 `v1.1.0-alpha.0` tag 的发布收口提交
- 当前分支：`master`
- 本轮下一步：补齐 `gh` 或 `GH_TOKEN/GITHUB_TOKEN` 后执行 `npm run release:publish:api -- --skip-tag-check`（或已认证环境下直接执行 `npm run release:publish -- --skip-tag-check`）完成 GitHub Release 真实发布

## 当前发布状态

- Package version：`1.1.0-alpha.1`
- CLI version：`1.1.0-alpha.1`
- 里程碑：`v1.1.0-alpha.1`
- 当前发布目标：`v1.1.0-alpha.1`
- 已发布版本记录：
  - `1.0.0`
  - `1.1.0-alpha.0`
  - `1.2.0-alpha.0`
  - `1.3.0-alpha.0`
- 规则要求：每个版本构建闭环完成后必须发布 GitHub Release（`print-command` 后执行 `--skip-tag-check`）

## 本轮验收结果（2026-07-08）

### 已完成（PASS）

- `npm run release:publish:print-command`: PASS，输出 `gh release create v1.1.0-alpha.1 --title "CtxSift v1.1.0-alpha.1" --notes-file docs\\release-v1.1.0-alpha.1.md --target master --verify-tag --prerelease`
- `npm run lint`: PASS
- `npm run typecheck`: PASS
- `npm run test:e2e`: PASS
- `npm run build`: PASS
- `npm run bench:fixtures`: PASS，6 个 fixture 校验通过
- `npm run bench:report`: PASS，动态 pr-diff fixture 因当前环境 Git 不可用跳过，生成/覆盖 `benchmarks/benchmark-report.md` 与 `benchmarks/benchmark-report.json`（5 条结果）
- `npm run pack:dry-run`: BLOCKED（`spawnSync F:\\node\\node.exe EPERM`）
- `npm run release:publish -- --skip-tag-check`: BLOCKED，环境未安装 `gh` 且未配置 `GH_TOKEN/GITHUB_TOKEN`
- `npm run release:publish:api -- --skip-tag-check`: BLOCKED，GitHub API 返回 `401 Requires authentication`
- `npm run audit:high`: BLOCKED（网络受限导致 `pnpm audit --audit-level high --registry https://registry.npmjs.org` 报 `fetch failed`）
- 发布命令预检：`gh release create v1.1.0-alpha.1 --title "CtxSift v1.1.0-alpha.1" --notes-file docs\\release-v1.1.0-alpha.1.md --target master --verify-tag --prerelease`
- `npm run release:check`: BLOCKED（`pnpm run release:check` 当前失败在 pnpm 安装阶段且 `npm run release:check` 因 `spawn EPERM` 中断于 `vitest` 配置加载）
- `npm run pack:dry-run`（环境变量注入）: BLOCKED，设置 `CTXSIFT_NPM_COMMAND='[\"npm\"]'` 后仍报 `spawnSync npm EPERM`；说明当前环境对 `npm` 子进程启动级别仍被限制。
- `npm run pack:dry-run`（路径注入）: BLOCKED，设置 `CTXSIFT_NPM_COMMAND='[\"npm.cmd\"]'` 后仍报 `spawnSync npm.cmd EINVAL`。
- `npm run pack:dry-run`（提权尝试）: BLOCKED，因提权自动审批触发用量限制，系统未放行（错误：`Automatic approval review failed`，`usage limit`）。

### 失败与阻塞（仅限 spawn 场景说明）

- `npm run release:publish -- --skip-tag-check`: BLOCKED（`gh` 与 token 均未提供），需提供认证后重试。
- `npm run release:publish:api -- --skip-tag-check`: BLOCKED（`401 Requires authentication`），需提供 `GH_TOKEN/GITHUB_TOKEN` 后重跑发布命令。
- `npm run pack:dry-run`: BLOCKED（本轮命令链直接调用 `npm run pack:dry-run` 命中 `spawnSync ...EPERM`，未写出新的 `ctxsift-*.tgz` 文件）
- `npm run audit:high`: BLOCKED（本轮环境外网受限，`pnpm audit` 返回 `fetch failed`，需外网与 registry 可达后重试）

## 本轮验收结果（2026-07-07）

### 已完成（PASS）

- `pnpm lint`（等价于 `npm run lint`）: PASS（`node_modules` 已可执行）
- `pnpm typecheck`（等价于 `npm run typecheck`）: PASS
- `pnpm test`（等价于 `npm run test`）: PASS（提权环境下）
- `pnpm test:e2e`（等价于 `npm run test:e2e`）: PASS
- `pnpm test:examples`（等价于 `npm run test:examples`）: PASS
- `pnpm build`（等价于 `npm run build`）: PASS
- `pnpm pack:dry-run`（等价于 `npm run pack:dry-run`）: PASS（`ctxsift-1.1.0-alpha.1.tgz`）
- `pnpm bench:fixtures`（等价于 `npm run bench:fixtures`）: PASS（6 个 fixtures 校验通过）
- `pnpm bench:report`（等价于 `npm run bench:report`）: PASS（报告更新为 5 条记录）
- `pnpm audit --audit-level high --registry https://registry.npmjs.org`（等价于 `npm run audit:high`）: PASS（`No known vulnerabilities`）
- `pnpm run release:check`（等价于 `npm run release:check`）: PASS
- `npm run release:publish:print-command`: PASS（输出 `gh release create v1.1.0-alpha.1 --title ...`）
- `npm run test -- tests/release-publish.test.ts tests/release-state.test.ts`: PASS（提权环境下，覆盖 `gh` CLI 路径已存在 Release 时的幂等确认行为，并确认发布状态文档仍跟随当前版本）
- `npm run test -- tests/sync-scope.test.ts tests/release-publish.test.ts tests/release-state.test.ts`: PASS（提权环境下，覆盖同步范围、发布脚本与发布状态记录）
- `npm run test -- tests/pack-dry-run.test.ts tests/sync-scope.test.ts tests/release-publish.test.ts tests/release-state.test.ts`: PASS（提权环境下，覆盖打包范围、同步范围、发布脚本与发布状态记录）
- `npm run test -- tests/audit-high.test.ts tests/pack-dry-run.test.ts tests/sync-scope.test.ts tests/release-publish.test.ts tests/release-state.test.ts`: PASS（提权环境下，覆盖审计脚本、打包范围、同步范围、发布脚本与发布状态记录）
- `npm run test -- tests/bench-fixtures.test.ts tests/audit-high.test.ts tests/pack-dry-run.test.ts tests/sync-scope.test.ts tests/release-publish.test.ts tests/release-state.test.ts`: PASS（提权环境下，覆盖基准 fixture 校验、审计脚本、打包范围、同步范围、发布脚本与发布状态记录）
- `npm run test -- tests/release-publish.test.ts tests/release-state.test.ts tests/bench-fixtures.test.ts tests/audit-high.test.ts tests/pack-dry-run.test.ts tests/sync-scope.test.ts`: PASS（提权环境下，覆盖 shell-safe 发布命令预览、发布状态、基准 fixture、审计脚本、打包范围与同步范围）
- `npm run test -- tests/e2e-script.test.ts tests/release-publish.test.ts tests/release-state.test.ts tests/bench-fixtures.test.ts tests/audit-high.test.ts tests/pack-dry-run.test.ts tests/sync-scope.test.ts`: PASS（提权环境下，覆盖 E2E 临时仓库清理、shell-safe 发布命令预览、发布状态、基准 fixture、审计脚本、打包范围与同步范围）
- `npm run test -- tests/pack-dry-run.test.ts tests/e2e-script.test.ts tests/release-publish.test.ts tests/release-state.test.ts tests/bench-fixtures.test.ts tests/audit-high.test.ts tests/sync-scope.test.ts`: PASS（提权环境下，覆盖嵌套临时目录打包拦截、E2E 临时仓库清理、发布命令预览、发布状态、基准 fixture、审计脚本与同步范围）
- `npm run test -- tests/bench-script.test.ts tests/bench-fixtures.test.ts tests/pack-dry-run.test.ts tests/e2e-script.test.ts tests/release-publish.test.ts tests/release-state.test.ts tests/audit-high.test.ts tests/sync-scope.test.ts`: PASS（提权环境下，覆盖 benchmark 临时仓库清理、基准 fixture、打包范围、E2E 临时仓库清理、发布脚本、审计脚本与同步范围）
- `npm run test -- tests/release-github-utils.test.ts tests/release-publish.test.ts tests/release-state.test.ts tests/bench-script.test.ts tests/bench-fixtures.test.ts tests/pack-dry-run.test.ts tests/e2e-script.test.ts tests/audit-high.test.ts tests/sync-scope.test.ts`: PASS（提权环境下，覆盖 release repository URL 解析、发布脚本、发布状态、benchmark 临时仓库清理、打包范围、E2E 临时仓库清理、审计脚本与同步范围）
- `npm run test:e2e`: PASS（动态 diff 仓库场景通过，并在 `finally` 中清理临时仓库）
- `npm run pack:dry-run`: PASS（提权环境下，真实 npm 包清单未包含本地规则、临时文件或根目录 legacy benchmark report）
- `npm run audit:high`: PASS（提权环境下，`No known vulnerabilities found`）
- `npm run bench:fixtures`: PASS（实际校验 6 个 benchmark fixtures，包括动态 PR diff 的源 fixture `tests/fixtures/pr-review`）
- `npm run bench:report`: PASS（当前环境 Git 不可用，动态 PR diff fixture 按既有逻辑跳过；报告写入 5 个 fixtures）
- `npm run bench:fixtures` + `npm run bench:report`: PASS（本轮基准证据刷新；6 个 fixtures 预检通过，报告重新写入 `benchmarks/benchmark-report.md/json`，当前环境 Git 不可用所以动态 PR diff benchmark 跳过并生成 5 个结果）
- `npm run test -- tests/release-github-utils.test.ts`: PASS（提权环境下，10 个测试通过；覆盖 GitHub shorthand repository URL 中 `#release` fragment 的仓库名归一化）
- `npm run test -- tests/release-github-utils.test.ts`: PASS（提权环境下，11 个测试通过；覆盖发布命令预览中单引号参数的引用行为）
- `npm run test -- tests/release-github-utils.test.ts`: PASS（提权环境下，12 个测试通过；覆盖归一化后仓库名为空的 GitHub shorthand repository URL 拒绝行为）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，3 个测试通过；覆盖 `.env` 敏感配置文件进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，16 个测试通过；覆盖 `.envrc` direnv 环境文件进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，4 个测试通过；覆盖私钥与证书类文件进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，27 个测试通过；覆盖 Java keystore/truststore 文件进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，28 个测试通过；覆盖 Apple AuthKey 与 mobile provisioning profile 文件进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，37 个测试通过；覆盖 Firebase 移动端应用配置文件进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，39 个测试通过；覆盖 Android/Flutter `local.properties` 进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，29 个测试通过；覆盖 GnuPG/PGP 私钥导出文件进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，30 个测试通过；覆盖 KeePass 与 1Password vault 文件进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，31 个测试通过；覆盖 PuTTY 私钥与 macOS Keychain 文件进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，5 个测试通过；覆盖包管理器认证配置文件进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，32 个测试通过；覆盖 RubyGems 与 Bundler 本地凭据文件进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，33 个测试通过；覆盖 Android/Flutter 签名属性文件进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，17 个测试通过；覆盖 `.pypirc` 与 `credentials.toml` 跨语言发布凭据进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，18 个测试通过；覆盖 `auth.json` 与 `NuGet.Config` 跨生态认证配置进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，19 个测试通过；覆盖 `.m2/settings.xml` 与 `.gradle/gradle.properties` JVM 仓库认证配置进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，40 个测试通过；覆盖项目内 `gradle.properties` 进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，6 个测试通过；覆盖通用凭据文件进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，41 个测试通过；覆盖带前缀 credential JSON 文件进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，36 个测试通过；覆盖 Google OAuth client secret 文件进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，7 个测试通过；覆盖 token 与 generated secret 文件进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，8 个测试通过；覆盖 service account 凭据文件进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，34 个测试通过；覆盖 Firebase/GCP 服务账号私钥命名变体进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，9 个测试通过；覆盖敏感文件大小写变体进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，10 个测试通过；覆盖云 SDK 凭据文件进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，22 个测试通过；覆盖 Azure CLI 与 gcloud CLI token/cache 文件进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，23 个测试通过；覆盖 Vercel、Netlify 与 Heroku 部署平台 CLI 登录态文件进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，24 个测试通过；覆盖 Sentry、Snyk 与 Firebase Tools CLI 凭据缓存进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，38 个测试通过；覆盖 Sentry properties 文件进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，11 个测试通过；覆盖 Docker registry 认证配置进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，12 个测试通过；覆盖 SSH client config 进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，13 个测试通过；覆盖 Kubernetes client config 进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，14 个测试通过；覆盖 Git repository config 进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，20 个测试通过；覆盖 `.git-credentials` 与 `.gitconfig` 用户级 Git 凭据文件进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，21 个测试通过；覆盖 `.config/gh/hosts.yml` 与 `.config/gh/hosts.yaml` GitHub CLI 登录凭据进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，15 个测试通过；覆盖 Terraform variable/state 文件进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，25 个测试通过；覆盖 Terraform CLI credentials 与 Vault token 进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，26 个测试通过；覆盖 `.DS_Store`、`Thumbs.db`、Vim swap 与编辑器备份文件进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts`: PASS（提权环境下，35 个测试通过；覆盖带环境前缀的 token/secret 文件进入 npm dry-run 清单时必须失败）
- `npm run test -- tests/pack-dry-run.test.ts tests/sync-scope.test.ts tests/release-state.test.ts`: PASS（提权环境下，3 个测试文件 / 17 个测试通过；覆盖 Terraform 打包护栏、同步范围与发布状态记录）
- `npm run test -- tests/pack-dry-run.test.ts tests/sync-scope.test.ts tests/release-state.test.ts`: PASS（提权环境下，3 个测试文件 / 18 个测试通过；覆盖 `.envrc` 打包护栏、同步范围与发布状态记录）
- `npm run test -- tests/pack-dry-run.test.ts tests/sync-scope.test.ts tests/release-state.test.ts`: PASS（提权环境下，3 个测试文件 / 19 个测试通过；覆盖跨语言发布凭据打包护栏、同步范围与发布状态记录）
- `npm run test -- tests/pack-dry-run.test.ts tests/sync-scope.test.ts tests/release-state.test.ts`: PASS（提权环境下，3 个测试文件 / 20 个测试通过；覆盖 Composer/NuGet 认证配置打包护栏、同步范围与发布状态记录）
- `npm run test -- tests/pack-dry-run.test.ts tests/sync-scope.test.ts tests/release-state.test.ts`: PASS（提权环境下，3 个测试文件 / 21 个测试通过；覆盖 Maven/Gradle 认证配置打包护栏、同步范围与发布状态记录）
- `npm run test -- tests/pack-dry-run.test.ts tests/sync-scope.test.ts tests/release-state.test.ts`: PASS（提权环境下，3 个测试文件 / 22 个测试通过；覆盖 Git 用户级凭据打包护栏、同步范围与发布状态记录）
- `npm run test -- tests/pack-dry-run.test.ts tests/sync-scope.test.ts tests/release-state.test.ts`: PASS（提权环境下，3 个测试文件 / 23 个测试通过；覆盖 GitHub CLI hosts 凭据打包护栏、同步范围与发布状态记录）
- `npm run test -- tests/pack-dry-run.test.ts tests/sync-scope.test.ts tests/release-state.test.ts`: PASS（提权环境下，3 个测试文件 / 24 个测试通过；覆盖云 CLI token/cache 打包护栏、同步范围与发布状态记录）
- `npm run test -- tests/pack-dry-run.test.ts tests/sync-scope.test.ts tests/release-state.test.ts`: PASS（提权环境下，3 个测试文件 / 25 个测试通过；覆盖部署平台 CLI 登录态打包护栏、同步范围与发布状态记录）
- `npm run test -- tests/pack-dry-run.test.ts tests/sync-scope.test.ts tests/release-state.test.ts`: PASS（提权环境下，3 个测试文件 / 26 个测试通过；覆盖 CLI 工具凭据缓存打包护栏、同步范围与发布状态记录）
- `npm run test -- tests/pack-dry-run.test.ts tests/sync-scope.test.ts tests/release-state.test.ts`: PASS（提权环境下，3 个测试文件 / 27 个测试通过；覆盖 HashiCorp CLI 凭据打包护栏、同步范围与发布状态记录）
- `npm run test -- tests/pack-dry-run.test.ts tests/sync-scope.test.ts tests/release-state.test.ts`: PASS（提权环境下，3 个测试文件 / 28 个测试通过；覆盖 OS/editor 临时产物打包护栏、同步范围与发布状态记录）
- `npm run test -- tests/pack-dry-run.test.ts tests/sync-scope.test.ts tests/release-state.test.ts`: PASS（提权环境下，3 个测试文件 / 29 个测试通过；覆盖 Java keystore 打包护栏、同步范围与发布状态记录）
- `npm run test -- tests/pack-dry-run.test.ts tests/sync-scope.test.ts tests/release-state.test.ts`: PASS（提权环境下，3 个测试文件 / 30 个测试通过；覆盖移动端签名凭据打包护栏、同步范围与发布状态记录）
- `npm run test -- tests/pack-dry-run.test.ts tests/sync-scope.test.ts tests/release-state.test.ts`: PASS（提权环境下，3 个测试文件 / 31 个测试通过；覆盖 GnuPG/PGP 私钥打包护栏、同步范围与发布状态记录）
- `npm run test -- tests/pack-dry-run.test.ts tests/sync-scope.test.ts tests/release-state.test.ts`: PASS（提权环境下，3 个测试文件 / 32 个测试通过；覆盖密码管理器 vault 打包护栏、同步范围与发布状态记录）
- `npm run test -- tests/pack-dry-run.test.ts tests/sync-scope.test.ts tests/release-state.test.ts`: PASS（提权环境下，3 个测试文件 / 33 个测试通过；覆盖 PuTTY/macOS Keychain 打包护栏、同步范围与发布状态记录）
- `npm run test -- tests/pack-dry-run.test.ts tests/sync-scope.test.ts tests/release-state.test.ts`: PASS（提权环境下，3 个测试文件 / 34 个测试通过；覆盖 RubyGems/Bundler 打包护栏、同步范围与发布状态记录）
- `npm run test -- tests/pack-dry-run.test.ts tests/sync-scope.test.ts tests/release-state.test.ts`: PASS（提权环境下，3 个测试文件 / 35 个测试通过；覆盖 Android/Flutter 签名属性打包护栏、同步范围与发布状态记录）
- `npm run test -- tests/pack-dry-run.test.ts tests/sync-scope.test.ts tests/release-state.test.ts`: PASS（提权环境下，3 个测试文件 / 36 个测试通过；覆盖 Firebase/GCP 服务账号变体打包护栏、同步范围与发布状态记录）
- `npm run test -- tests/pack-dry-run.test.ts tests/sync-scope.test.ts tests/release-state.test.ts`: PASS（提权环境下，3 个测试文件 / 37 个测试通过；覆盖带前缀 token/secret 打包护栏、同步范围与发布状态记录）
- `npm run test -- tests/pack-dry-run.test.ts tests/sync-scope.test.ts tests/release-state.test.ts`: PASS（提权环境下，3 个测试文件 / 38 个测试通过；覆盖 OAuth client secret 打包护栏、同步范围与发布状态记录）
- `npm run test -- tests/pack-dry-run.test.ts tests/sync-scope.test.ts tests/release-state.test.ts`: PASS（提权环境下，3 个测试文件 / 39 个测试通过；覆盖 Firebase 移动端应用配置打包护栏、同步范围与发布状态记录）
- `npm run test -- tests/pack-dry-run.test.ts tests/sync-scope.test.ts tests/release-state.test.ts`: PASS（提权环境下，3 个测试文件 / 40 个测试通过；覆盖 Sentry properties 打包护栏、同步范围与发布状态记录）
- `npm run test -- tests/pack-dry-run.test.ts tests/sync-scope.test.ts tests/release-state.test.ts`: PASS（提权环境下，3 个测试文件 / 41 个测试通过；覆盖 Android/Flutter `local.properties` 打包护栏、同步范围与发布状态记录）
- `npm run test -- tests/pack-dry-run.test.ts tests/sync-scope.test.ts tests/release-state.test.ts`: PASS（提权环境下，3 个测试文件 / 42 个测试通过；覆盖项目内 `gradle.properties` 打包护栏、同步范围与发布状态记录）
- `npm run typecheck`: PASS（本轮增量验证）
- `npm run lint`: PASS（本轮增量验证）
- `npm run typecheck`: PASS（本轮云 CLI token/cache 打包护栏增量验证）
- `npm run lint`: PASS（本轮云 CLI token/cache 打包护栏增量验证）
- `npm run typecheck`: PASS（本轮部署平台 CLI 登录态打包护栏增量验证）
- `npm run lint`: PASS（本轮部署平台 CLI 登录态打包护栏增量验证）
- `npm run typecheck`: PASS（本轮 CLI 工具凭据缓存打包护栏增量验证）
- `npm run lint`: PASS（本轮 CLI 工具凭据缓存打包护栏增量验证）
- `npm run typecheck`: PASS（本轮 HashiCorp CLI 凭据打包护栏增量验证）
- `npm run lint`: PASS（本轮 HashiCorp CLI 凭据打包护栏增量验证）
- `npm run typecheck`: PASS（本轮 OS/editor 临时产物打包护栏增量验证）
- `npm run lint`: PASS（本轮 OS/editor 临时产物打包护栏增量验证）
- `npm run typecheck`: PASS（本轮 Java keystore 打包护栏增量验证）
- `npm run lint`: PASS（本轮 Java keystore 打包护栏增量验证）
- `npm run typecheck`: PASS（本轮移动端签名凭据打包护栏增量验证）
- `npm run lint`: PASS（本轮移动端签名凭据打包护栏增量验证）
- `npm run typecheck`: PASS（本轮 GnuPG/PGP 私钥打包护栏增量验证）
- `npm run lint`: PASS（本轮 GnuPG/PGP 私钥打包护栏增量验证）
- `npm run typecheck`: PASS（本轮密码管理器 vault 打包护栏增量验证）
- `npm run lint`: PASS（本轮密码管理器 vault 打包护栏增量验证）
- `npm run typecheck`: PASS（本轮 PuTTY/macOS Keychain 打包护栏增量验证）
- `npm run lint`: PASS（本轮 PuTTY/macOS Keychain 打包护栏增量验证）
- `npm run typecheck`: PASS（本轮 RubyGems/Bundler 打包护栏增量验证）
- `npm run lint`: PASS（本轮 RubyGems/Bundler 打包护栏增量验证）
- `npm run typecheck`: PASS（本轮 Android/Flutter 签名属性打包护栏增量验证）
- `npm run lint`: PASS（本轮 Android/Flutter 签名属性打包护栏增量验证）
- `npm run typecheck`: PASS（本轮 Firebase/GCP 服务账号变体打包护栏增量验证）
- `npm run lint`: PASS（本轮 Firebase/GCP 服务账号变体打包护栏增量验证）
- `npm run typecheck`: PASS（本轮带前缀 token/secret 打包护栏增量验证）
- `npm run lint`: PASS（本轮带前缀 token/secret 打包护栏增量验证）
- `npm run typecheck`: PASS（本轮 OAuth client secret 打包护栏增量验证）
- `npm run lint`: PASS（本轮 OAuth client secret 打包护栏增量验证）
- `npm run typecheck`: PASS（本轮 Firebase 移动端应用配置打包护栏增量验证）
- `npm run lint`: PASS（本轮 Firebase 移动端应用配置打包护栏增量验证）
- `npm run typecheck`: PASS（本轮 Sentry properties 打包护栏增量验证）
- `npm run lint`: PASS（本轮 Sentry properties 打包护栏增量验证）
- `npm run typecheck`: PASS（本轮 Android/Flutter `local.properties` 打包护栏增量验证）
- `npm run lint`: PASS（本轮 Android/Flutter `local.properties` 打包护栏增量验证）
- `npm run typecheck`: PASS（本轮项目内 `gradle.properties` 打包护栏增量验证）
- `npm run lint`: PASS（本轮项目内 `gradle.properties` 打包护栏增量验证）
- `npm run typecheck`: PASS（本轮带前缀 credential JSON 打包护栏增量验证）
- `npm run lint`: PASS（本轮带前缀 credential JSON 打包护栏增量验证）
- `npm run release:publish:print-command`: PASS（输出 `--title "CtxSift v1.1.0-alpha.1"`，命令预览可直接复制）
- `npm run release:check`: PASS（提权环境下完整发布门禁通过；Vitest 33 个测试文件 / 86 个测试通过，E2E、examples、build、pack dry-run 与 high audit 均通过）
- `git push origin v1.1.0-alpha.1`: PASS（tag 已推送，指向 `30fc0964821c0eb6b7fc146355818fdb1063339a`）
- `npm run release:publish`: BLOCKED（当前环境无 `gh` 且无 `GH_TOKEN/GITHUB_TOKEN`）
- `npm run release:publish:api`: BLOCKED（GitHub API 返回 `401 Requires authentication`）
- 发布命令预检：`gh release create v1.1.0-alpha.1 --title CtxSift v1.1.0-alpha.1 --notes-file docs\\release-v1.1.0-alpha.1.md --target master --verify-tag --prerelease`

### 失败与阻塞（仅限 spawn 场景说明）

- `pnpm lint`: BLOCKED（当前环境 `pnpm` 首次执行会尝试从 npmmirror 拉取元数据并出现 EPERM 清理 `_tmp_*`）
- `npm run test -- tests/release-publish.test.ts`: BLOCKED（沙箱内 Vitest 启动 esbuild 子进程触发 `spawn EPERM`；已按 spawn 类验证步骤提权复跑，并用 `npm run test -- tests/release-publish.test.ts tests/release-state.test.ts` 通过）
- `npm run pack:dry-run`: BLOCKED（沙箱内真实 npm CLI 需要 spawn Node，触发 `spawnSync F:\\node\\node.exe EPERM`；已按 spawn 类验证步骤提权复跑并通过）
- `npm run release:check`: BLOCKED（沙箱内执行到 `npm run test` 时 Vitest 启动 esbuild 子进程触发 `spawn EPERM`；已按 spawn 类验证步骤提权复跑完整命令并通过）
- `npm run audit:high`: BLOCKED（首次真实 registry 请求出现 `ECONNRESET` 重试；提权执行后完成并返回 `No known vulnerabilities found`）
- `npm run test -- tests/release-github-utils.test.ts tests/release-state.test.ts`: BLOCKED（本轮相关 Vitest 集合需要提权避开 `spawn EPERM`，但提权验证被当前 Codex 用量限制拒绝；未绕过执行）
- `npm run test -- tests/pack-dry-run.test.ts`: BLOCKED（本轮普通沙箱启动 Vitest 时触发 esbuild 子进程 `spawn EPERM`；已按 spawn 类验证步骤提权复跑并通过）
- `npm run test -- tests/pack-dry-run.test.ts`: BLOCKED（本轮部署平台 CLI 登录态护栏的普通沙箱红灯验证被 esbuild 子进程 `spawn EPERM` 阻断；已按 spawn 类验证步骤提权复跑并通过）
- `npm run test -- tests/pack-dry-run.test.ts`: BLOCKED（本轮 CLI 工具凭据缓存护栏的普通沙箱红灯验证被 esbuild 子进程 `spawn EPERM` 阻断；已按 spawn 类验证步骤提权复跑并通过）
- `npm run test -- tests/pack-dry-run.test.ts`: BLOCKED（本轮 HashiCorp CLI 凭据护栏的普通沙箱红灯验证被 esbuild 子进程 `spawn EPERM` 阻断；已按 spawn 类验证步骤提权复跑并通过）
- `npm run test -- tests/pack-dry-run.test.ts`: BLOCKED（本轮 OS/editor 临时产物护栏的普通沙箱红灯验证被 esbuild 子进程 `spawn EPERM` 阻断；已按 spawn 类验证步骤提权复跑并通过）
- `npm run test -- tests/pack-dry-run.test.ts`: BLOCKED（本轮 Java keystore 护栏的普通沙箱红灯验证被 esbuild 子进程 `spawn EPERM` 阻断；已按 spawn 类验证步骤提权复跑并通过）
- `npm run test -- tests/pack-dry-run.test.ts`: BLOCKED（本轮移动端签名凭据护栏的普通沙箱红灯验证被 esbuild 子进程 `spawn EPERM` 阻断；已按 spawn 类验证步骤提权复跑并通过）
- `npm run test -- tests/pack-dry-run.test.ts`: BLOCKED（本轮 GnuPG/PGP 私钥护栏的普通沙箱红灯验证被 esbuild 子进程 `spawn EPERM` 阻断；已按 spawn 类验证步骤提权复跑并通过）
- `npm run test -- tests/pack-dry-run.test.ts`: BLOCKED（本轮密码管理器 vault 护栏的普通沙箱红灯验证被 esbuild 子进程 `spawn EPERM` 阻断；已按 spawn 类验证步骤提权复跑并通过）
- `npm run test -- tests/pack-dry-run.test.ts`: BLOCKED（本轮 PuTTY/macOS Keychain 护栏的普通沙箱红灯验证被 esbuild 子进程 `spawn EPERM` 阻断；已按 spawn 类验证步骤提权复跑并通过）
- `npm run test -- tests/pack-dry-run.test.ts`: BLOCKED（本轮 RubyGems/Bundler 护栏的普通沙箱红灯验证被 esbuild 子进程 `spawn EPERM` 阻断；已按 spawn 类验证步骤提权复跑并通过）
- `npm run test -- tests/pack-dry-run.test.ts`: BLOCKED（本轮 Android/Flutter 签名属性护栏的普通沙箱红灯验证被 esbuild 子进程 `spawn EPERM` 阻断；已按 spawn 类验证步骤提权复跑并通过）
- `npm run test -- tests/pack-dry-run.test.ts`: BLOCKED（本轮 Firebase/GCP 服务账号变体护栏的普通沙箱红灯验证被 esbuild 子进程 `spawn EPERM` 阻断；已按 spawn 类验证步骤提权复跑并通过）
- `npm run test -- tests/pack-dry-run.test.ts`: BLOCKED（本轮带前缀 token/secret 护栏的普通沙箱红灯验证被 esbuild 子进程 `spawn EPERM` 阻断；已按 spawn 类验证步骤提权复跑并通过）
- `npm run test -- tests/pack-dry-run.test.ts`: BLOCKED（本轮 OAuth client secret 护栏的普通沙箱红灯验证被 esbuild 子进程 `spawn EPERM` 阻断；已按 spawn 类验证步骤提权复跑并通过）
- `npm run test -- tests/pack-dry-run.test.ts`: BLOCKED（本轮 Firebase 移动端应用配置护栏的普通沙箱红灯验证被 esbuild 子进程 `spawn EPERM` 阻断；已按 spawn 类验证步骤提权复跑并通过）
- `npm run test -- tests/pack-dry-run.test.ts`: BLOCKED（本轮 Sentry properties 护栏的普通沙箱红灯验证被 esbuild 子进程 `spawn EPERM` 阻断；已按 spawn 类验证步骤提权复跑并通过）
- `npm run test -- tests/pack-dry-run.test.ts`: BLOCKED（本轮 Android/Flutter `local.properties` 护栏的普通沙箱红灯验证被 esbuild 子进程 `spawn EPERM` 阻断；已按 spawn 类验证步骤提权复跑并通过）
- `npm run test -- tests/pack-dry-run.test.ts`: BLOCKED（本轮项目内 `gradle.properties` 护栏的普通沙箱红灯验证被 esbuild 子进程 `spawn EPERM` 阻断；已按 spawn 类验证步骤提权复跑并通过）
- `npm run test -- tests/pack-dry-run.test.ts`: BLOCKED（本轮带前缀 credential JSON 护栏的普通沙箱红灯验证被 esbuild 子进程 `spawn EPERM` 阻断；已按 spawn 类验证步骤提权复跑并通过）
- `npm run test -- tests/pack-dry-run.test.ts tests/sync-scope.test.ts tests/release-state.test.ts`: BLOCKED（本轮带前缀 credential JSON 相关集合普通沙箱被 esbuild 子进程 `spawn EPERM` 阻断；提权复跑被当前 Codex 用量限制拒绝，未绕过执行）
- `npm run release:publish`: BLOCKED（新 tag 首次创建 Release 需要 `gh` 或 `GH_TOKEN/GITHUB_TOKEN`）
- `npm run release:publish:api`: BLOCKED（无 token，GitHub API 返回 401）
- `gh` CLI 与 `GH_TOKEN/GITHUB_TOKEN`: BLOCKED（当前环境缺少该能力）

### 根因说明

- `pnpm` 会尝试访问外网 registry，当前受限导致命令失败；核心命令链通过 `npm` 已闭环通过。
- `v1.1.0-alpha.0` 已在 GitHub 成功发布，但该 tag 指向旧提交；当前 `master` 后续收口提交必须使用新 tag `v1.1.0-alpha.1` 发布，不能移动旧 tag。
- `v1.1.0-alpha.1` tag 已推送并指向当前收口提交；GitHub Release 页面仍需 `gh` 登录态或 `GH_TOKEN/GITHUB_TOKEN` 才能创建。
- `release:publish` 与 `release:publish:api` 的已存在 Release 处理已保持一致；若目标 Release 已由外部创建，脚本会确认并返回成功，不再重复创建。
- `.gitignore` 已补齐根目录遗留 `benchmark-report.md/json`，并由 `tests/sync-scope.test.ts` 防止同步范围回归。
- `pack:dry-run` 已改为解析 npm JSON 清单并显式拒绝本地规则与临时产物；脚本优先通过 Node 直接运行 npm CLI，避免 shell 触发额外沙箱限制。
- `pack:dry-run` 已显式拒绝 `.env` 与 `.env.*` 文件，避免敏感环境配置进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `.envrc`，避免 direnv 本地 shell 环境导出文件进入 npm 发布包。
- `pack:dry-run` 已显式拒绝常见私钥和证书容器文件，避免 `id_rsa`、`.pem`、`.key`、`.p12`、`.pfx` 等敏感文件进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `.jks`、`.jceks` 与 `.keystore`，避免 Java keystore/truststore 中的私钥或凭据进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `.p8`、`.mobileprovision` 与 `.provisionprofile`，避免 Apple AuthKey 与 mobile provisioning profile 进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `google-services.json` 与 `GoogleService-Info.plist`，避免移动端 Firebase 应用配置进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `secring.gpg`、`private-key.asc`、`secret-key.asc` 与 `private.pgp`，避免 GnuPG/PGP 私钥导出文件进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `.kdbx`、`.opvault` 与 `.agilekeychain`，避免 KeePass 与 1Password vault 文件进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `.ppk`、`.keychain-db` 与 `.keychain`，避免 PuTTY 私钥和 macOS Keychain 文件进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `.npmrc`、`.yarnrc`、`.yarnrc.yml` 与 `.pnpmrc`，避免包管理器认证配置和 registry token 进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `.bundle/config`，并通过既有 `credentials` 规则覆盖 `.gem/credentials`，避免 RubyGems/Bundler 本地凭据进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `android/key.properties`、`android/keystore.properties` 与 `android/signing.properties`，避免 Android/Flutter 签名密码进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `local.properties`，避免 Android/Flutter 本机 SDK 路径和本地签名配置引用进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `.pypirc` 与 `credentials.toml`，避免 PyPI/Cargo 等跨语言发布凭据进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `auth.json` 与 `NuGet.Config`，避免 Composer/NuGet registry 凭据进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `.m2/settings.xml` 与 `.gradle/gradle.properties`，避免 Maven/Gradle 仓库认证配置进入 npm 发布包。
- `pack:dry-run` 已显式拒绝项目内任意 `gradle.properties`，避免 Android 签名密码、Maven token 或本地代理凭据进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `.netrc`、`credentials.json` 与 `credential.json`，避免通用凭据文件进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `*-credentials.json`、`*_credentials.json` 与 `*.credentials.json`，避免 Play Store、部署平台或第三方服务凭据进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `client_secret*.json`、`client-secret(s).json` 与 `*-client-secret(s).json`，避免 Google OAuth 客户端密钥进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `.aws/credentials` 与 `application_default_credentials.json` 等云 SDK 凭据文件，避免云凭据进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `.azure/accessTokens.json`、`.azure/msal_token_cache.json`、`.config/gcloud/credentials.db` 与 `.config/gcloud/access_tokens.db`，避免 Azure CLI 与 gcloud CLI token/cache 文件进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `.netlify/config.json` 与 `.config/heroku/accounts.json`，并通过既有 `auth.json` 规则覆盖 `.vercel/auth.json` 与 `.config/heroku/auth.json`，避免部署平台 CLI 登录态进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `.sentryclirc`、`.config/configstore/snyk.json` 与 `.config/configstore/firebase-tools.json`，避免第三方 CLI 凭据缓存进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `sentry.properties`，避免移动端 source map 上传 token 进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `.docker/config.json`，避免 Docker registry 认证配置进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `.ssh/config`，避免 SSH 主机、跳板机与密钥路径配置进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `.kube/config`，避免 Kubernetes 集群凭据与上下文配置进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `.git/config`，避免带凭据远程地址或仓库本地配置进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `.git-credentials` 与 `.gitconfig`，避免用户级 Git 凭据和配置进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `.config/gh/hosts.yml` 与 `.config/gh/hosts.yaml`，避免 GitHub CLI 登录 token 进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 Terraform `*.tfvars`、`*.tfvars.json`、`*.tfstate` 与 `*.tfstate.backup`，避免 IaC 变量和状态文件进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `.terraformrc`、`terraform.rc`、`.terraform.d/credentials.tfrc.json` 与 `.vault-token`，避免 Terraform Cloud credentials 与 Vault token 进入 npm 发布包。
- `pack:dry-run` 已显式拒绝常见 `token(s)` 与 `secret(s)` JSON/YAML 文件，避免生成密钥或令牌文件进入 npm 发布包。
- `pack:dry-run` 已显式拒绝带环境前缀的 `*.token(s).json` 与 `*.secret(s).json/yaml/yml` 文件，避免按环境命名的密钥文件进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `service-account.json` 与 `service_account.json`，避免服务账号凭据进入 npm 发布包。
- `pack:dry-run` 已显式拒绝 `serviceAccountKey.json`、`gcp-service-account.json` 与 `*-firebase-adminsdk*.json`，避免 Firebase/GCP 服务账号私钥命名变体进入 npm 发布包。
- `pack:dry-run` 的敏感文件匹配已改为大小写不敏感，避免 `.ENV`、`CLIENT.PEM` 等大小写变体绕过发布包检查。
- `audit:high` 已改为 `execFileSync` 无 shell 调用，支持 `CTXSIFT_PNPM_COMMAND`/`CTXSIFT_NPM_COMMAND`，并在 Windows pnpm shim 场景下直接运行 pnpm 的 JS 入口。
- `bench:fixtures` 已校验 `tests/fixtures/pr-review` 源目录，防止动态 PR diff benchmark 源 fixture 缺失但预检仍显示通过。
- `release:publish:print-command` 已对含空格参数进行 shell-safe quoting，不再输出会把 Release 标题拆参的命令。
- `test:e2e` 已在动态 Git diff 场景中使用 `try/finally` 清理 `ctxsift-e2e-*` 临时仓库，减少连续测试造成的临时目录残留。
- `pack:dry-run` 的临时文件匹配已从根路径扩展到任意路径段，防止嵌套 `_tmp_*`、`.npm-cache*` 和 `tmp-npm-cache` 进入 npm 包。
- `pack:dry-run` 已显式拒绝 `.DS_Store`、`Thumbs.db`、Vim swap 文件与编辑器备份文件，避免 OS/editor 临时产物进入 npm 发布包。
- `bench:report` 已在动态 PR diff benchmark 场景中使用 `try/finally` 清理 `ctxsift-bench-pr-*` 临时仓库，避免中途异常造成残留。
- GitHub Release repository 解析逻辑已抽为 `scripts/release-github-utils.mjs`，并支持 `git+https://github.com/owner/repo.git`、`github:owner/repo` 与 `git@github.com:owner/repo.git` 这类 npm 常见 metadata。
- 带 fragment 的 GitHub repository URL（例如 `git+https://github.com/owner/repo.git#main`）已正确归一化仓库名，避免 API 发布请求路径出现 `repo.git`。
- `release:publish:print-command` 的命令 formatter 已将换行、回车和制表符转义为单行文本，避免命令预览被不可见字符拆行。
- `release:publish:print-command` 的命令 formatter 已引用包含 shell 元字符的参数，并转义 `$` 与反引号，避免复制命令时被 shell 解释为额外语法。
- `release:publish:print-command` 的命令 formatter 已引用包含单引号的参数，避免复制命令时被 shell 解释为未闭合字符串。
- `release:publish:print-command` 的命令 formatter 已将空字符串参数渲染为 `""`，避免命令预览丢失参数边界。
- GitHub Release repository 解析已覆盖 `ssh://git@github.com/owner/repo.git`，并拒绝 scp-style SSH 地址中的嵌套路径，避免 API 发布请求路径出现 `repo/subpath`。
- GitHub shorthand repository URL 中的 branch/tag fragment 现在会在解析仓库名时剥离，避免 `github:owner/repo.git#release` 被误解析为 `repo.git#release`。
- GitHub Release repository URL 在归一化后如果仓库名为空会被拒绝，避免 malformed metadata 生成无效 API 发布路径。

## 下一步（每个版本需重复）

1. 环境放开后重跑完整命令链：
    - `pnpm lint`
    - `pnpm typecheck`
    - `pnpm test`
    - `pnpm test:e2e`
    - `pnpm test:examples`
    - `pnpm build`
    - `pnpm pack:dry-run`
    - `pnpm bench:fixtures`
    - `pnpm bench:report`
    - `pnpm audit --audit-level high --registry https://registry.npmjs.org`
    - `pnpm run release:check`
2. 发布闭环：
    - `pnpm run release:publish:print-command`
    - `pnpm run release:publish -- --skip-tag-check`
3. 成功发布后回填 release URL 与发布时间到本文件及对应 `docs/release-*.md`。

## Latest Milestone Commit

- `cff11b5`（chore: 发布 v1.1.0-alpha.1 收口版本）
