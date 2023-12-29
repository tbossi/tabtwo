#!/usr/bin/env node
import { TabTwo } from "./index.js"
import { setTimeout } from "node:timers/promises"

const tt = new TabTwo('tabtwo-test', process.cwd())

if (process.argv[2] === 'install') {
    console.log('Install!')
    await tt.install(process.env, async (files) => {
        console.log('Edited files:', files)
        return true
    })
    process.exit(0)
} else if (process.argv[2] === 'uninstall') {
    console.log('Uninstall!')
    await tt.uninstall(process.env, async (files) => {
        console.log('Edited files:', files)
        return true
    })
    process.exit(0)
} else {
    if (process.argv[2] === '--shell-complete') {
        await tt.handleCompletion(process.env, async (info) => {
            return await setTimeout(500, [
                {name: 'opt1', description: 'desc1'},
                {name: 'opt2', description: 'desc2'},
                {name: JSON.stringify(info)},
                {name: JSON.stringify(process.argv)},
            ])
        })
        process.exit(0)
    } else {
        console.log('No valid option')
        console.log(process.argv)
    }
}