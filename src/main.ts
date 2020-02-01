import * as core from '@actions/core'
import { context } from '@actions/github'
import { exec } from '@actions/exec'

import run from './run'

run(exec, context, core, process.env)
