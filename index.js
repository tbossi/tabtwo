import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { detectShell } from './detectShell.js'
import { completions, getCompletionInfo, installBlockCheckRegex } from './shellCompletions.js'

export class TabTwo {
    constructor(programName, programCompletionFolder, programCompleter = `${programName} --shell-complete`) {
        this.programName = programName
        this.programCompletionFolder = programCompletionFolder
        this.programCompleter = programCompleter
    }

    getShell(env) {
        const shell = detectShell(env)

        if (!shell.type) {
            throw new Error('Cannot detect current shell')
        }

        return shell
    }

    getCompletionFilename(shell) {
        const scriptExtension = shell.type === 'powershell' ? 'ps1' : (shell.type === 'cmd' ? 'cmd' : 'sh')
        return path.join(this.programCompletionFolder, `${this.programName}_completion_for_${shell.type}.${scriptExtension}`)
    }

    async install(env, askConfirmation) {
        const shell = this.getShell(env)
        const completionFilename = this.getCompletionFilename(shell)
        
        if (askConfirmation) {
            const result = await askConfirmation([shell.configFile, completionFilename])
            if (!result) {
                return
            }
        }

        const shellCompletion = completions[shell.type](this.programName, completionFilename, this.programCompleter)
        
        await fs.writeFile(completionFilename, shellCompletion.source)

        const shellConfig = await fs.readFile(shell.configFile, 'utf-8')
        if (!shellConfig.includes(shellCompletion.installBlock)) {
            await fs.appendFile(shell.configFile, shellCompletion.installBlock)
        }
    }

    async uninstall(env, askConfirmation) {
        const shell = this.getShell(env)
        const completionFilename = this.getCompletionFilename(shell)
        
        if (askConfirmation) {
            const result = await askConfirmation([shell.configFile, completionFilename])
            if (!result) {
                return
            }
        }

        const blockRegex = installBlockCheckRegex(this.programName)

        const shellConfig = await fs.readFile(shell.configFile, 'utf-8')
        await fs.writeFile(shell.configFile, shellConfig.replace(blockRegex, ''))
        
        await fs.rm(completionFilename, {force: true})
    }

    async handleCompletion(env, generateCompletions) {
        const shell = this.getShell(env)
        const completionInfo = getCompletionInfo(env)

        const completions = await generateCompletions(completionInfo)
        if (!Array.isArray(completions)) {
            throw new Error('Completions must be an array')
        }

        const completionStrings = completions.map(({ name, description }) => {
            let str = name
            if (shell.type === 'zsh' && description) {
              str = `${name.replace(/:/g, '\\:')}:${description}`
            } else if (shell.type === 'fish' && description) {
              str = `${name}\t${description}`
            } else if (shell.type === 'powershell' && description) {
              str = `${name}\t${description}`
            }
        
            return str
        })
        for (const cs of completionStrings) {
            console.log(cs)
        }
    }
}