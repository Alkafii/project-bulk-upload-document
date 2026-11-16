[nodemon] starting `node --no-deprecation .\index.js`
node:internal/modules/run_main:107
    triggerUncaughtException(
    ^

Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'D:\18. Belajar Programming\Latihan Programming\Project Upload FIle\middleware\config\database.js' imported from D:\18. Belajar Programming\Latihan Programming\Project Upload FIle\middleware\upload.js
Did you mean to import "../config/database.js"?
    at finalizeResolution (node:internal/modules/esm/resolve:272:11)
    at moduleResolve (node:internal/modules/esm/resolve:879:10)
    at defaultResolve (node:internal/modules/esm/resolve:1006:11)
    at #cachedDefaultResolve (node:internal/modules/esm/loader:708:20)
    at #resolveAndMaybeBlockOnLoaderThread (node:internal/modules/esm/loader:728:38)
    at ModuleLoader.resolveSync (node:internal/modules/esm/loader:766:56)
    at #resolve (node:internal/modules/esm/loader:690:17)
    at ModuleLoader.getOrCreateModuleJob (node:internal/modules/esm/loader:610:35)
    at ModuleJob.syncLink (node:internal/modules/esm/module_job:277:33)
    at ModuleJob.link (node:internal/modules/esm/module_job:389:17) {
  code: 'ERR_MODULE_NOT_FOUND',
  url: 'file:///D:/18.%20Belajar%20Programming/Latihan%20Programming/Project%20Upload%20FIle/middleware/config/database.js'
}

Node.js v26.8.2
[nodemon] app crashed - waiting for file changes before starting...
