#!/usr/bin/env node
import { TabTwo } from "../index.js"
import { setTimeout } from "node:timers/promises"
import { fileURLToPath } from 'node:url'

// TODO: backup file to assert equality after uninstall (or maybe print hash and just check that?)
const dummyConfirmation = async (files) => {
    // Log file to assert in tests
    console.log(`Edited files:\n${files.map(f => `- ${f}`).join('\n')}`)
    return true
}

try {
    const tt = new TabTwo('tabtwo-test', fileURLToPath(new URL('.', import.meta.url)))
    if (process.argv[2] === 'install') {
        await tt.install(process.env, dummyConfirmation)
        console.log('Installed!')
        process.exit(0)
    } else if (process.argv[2] === 'uninstall') {
        await tt.uninstall(process.env, dummyConfirmation)
        console.log('Uninstalled!')
        process.exit(0)
    } else {
        if (process.argv[2] === '--shell-complete') {
            await tt.handleCompletion(process.env, async (info) => {
                let optList = process.argv.map((arg, index) => `argv_${index}___${arg}`)
                optList = optList.concat(Object.entries(info).map(([k, v]) => `info_${k}___${v}`))
                optList = optList.map(v => ({name: v}))
                optList.push({name: 'opt1', description: 'desc1'})
                optList.push({name: 'opt2', description: 'desc2'})
    
                return await setTimeout(500, optList)
            })
            process.exit(0)
        } else {
            console.log('No valid option')
            console.log(process.argv)
            process.exit(0)
        }
    }
} catch (error) {
    console.error(error.message)
    process.exit(1)
}
