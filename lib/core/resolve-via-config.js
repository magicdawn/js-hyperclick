"use babel"
/* eslint no-unused-vars: off */
/* eslint prefer-const: off */
/* eslint no-console: off */

import fs from "fs"
import { isAbsolute, dirname, resolve as pathResolve } from "path"
import { cosmiconfig, cosmiconfigSync } from "cosmiconfig"
import { sync as resolveSync } from "resolve"
import debugFactory from "debug"

const debug = debugFactory("js-hyperclick:resolve-via-config")
const explorerSync = cosmiconfigSync("js-hyperclick")

export default function resolveViaConfig({ basedir, moduleName, options }) {
  const result = explorerSync.search(basedir)
  if (!result || !result.config || !result.filepath) return

  const config = result.config
  const configFilepath = result.filepath
  const configFiledir = dirname(configFilepath)

  const {
    extensions = [".js", ".jsx", ".ts", ".tsx", ".vue", ".json"],
    alias = {},
  } = result.config

  // alias target relative to config.filepath
  for (let [key, val] of Object.entries(alias)) {
    if (!isAbsolute(val)) {
      val = pathResolve(configFiledir, val)
    }

    if (key === moduleName) {
      moduleName = val
      break
    }

    const regexp = new RegExp(key.endsWith("$") ? key : `^${key}/`)
    if (regexp.test(moduleName)) {
      if (val[val.length - 1] !== "/") val += "/"
      moduleName = moduleName.replace(regexp, val)
      break
    }
  }

  let resolved
  try {
    resolved = resolveSync(moduleName, { basedir, extensions })
  } catch (e) {
    console.error(e.stack || e)
    return
  }

  if (resolved) {
    return { type: "file", filename: resolved }
  }
}
