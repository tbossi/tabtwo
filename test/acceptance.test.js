import { fileURLToPath } from 'node:url'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import * as crypto from 'node:crypto'
import shelljs from 'shelljs'

const projectDir = path.join(fileURLToPath(import.meta.url), '../..')
const shellExpectFile = (name) => path.join(projectDir, 'test', 'acceptance-script', `acceptance_${name}.exp`)

const exec = (str) => {
    let result = shelljs.exec(str)
    if (result.code !== 0) {
        const error = new Error('Shell command error')
        error.stderr = result.stderr
        error.stdout = result.stdout
        error.code = result.code

        console.error(error.stderr)
        
        throw error
    }
    return {
        stdout: result.stdout,
        stderr: result.stderr,
    }
}

/*
 * This variables should be set before running the test by the running shell itself.
 * In this way we avoid relying on some logic to detect the actual platform and we ensure these are the correct values.
 */
const platformInfo = {
    os: process.env.TEST_OS,
    shell: process.env.TEST_SHELL,
}

const logRegexBashInstall = /Edited files:\n- "(\/.*)" \((.*)\)\n- "\/.*\/tabtwo-test_completion_for_bash.sh" \(.*\)\nInstalled!/s
const logRegexBashUninstall = /Edited files:\n- "(\/.*)" \((.*)\)\n- "\/.*\/tabtwo-test_completion_for_bash.sh" \(.*\)\nUninstalled!/s
const logRegexZshInstall = /Edited files:\n- "(\/.*)" \((.*)\)\n- "\/.*\/tabtwo-test_completion_for_zsh.sh" \(.*\)\nInstalled!/s
const logRegexZshUninstall = /Edited files:\n- "(\/.*)" \((.*)\)\n- "\/.*\/tabtwo-test_completion_for_zsh.sh" \(.*\)\nUninstalled!/s
const logRegexKshInstall = /Edited files:\n- "(\/.*)" \((.*)\)\n- "\/.*\/tabtwo-test_completion_for_ksh.sh" \(.*\)\nInstalled!/s
const logRegexKshUninstall = /Edited files:\n- "(\/.*)" \((.*)\)\n- "\/.*\/tabtwo-test_completion_for_ksh.sh" \(.*\)\nUninstalled!/s
const logRegexFishInstall = /Edited files:\n- "(\/.*)" \((.*)\)\n- "\/.*\/tabtwo-test_completion_for_fish.sh" \(.*\)\nInstalled!/s
const logRegexFishUninstall = /Edited files:\n- "(\/.*)" \((.*)\)\n- "\/.*\/tabtwo-test_completion_for_fish.sh" \(.*\)\nUninstalled!/s
const logRegexPowershellInstall = /Edited files:\n- "(\/.*)" \((.*)\)\n- "\/.*\/tabtwo-test_completion_for_powershell.ps1" \(.*\)\nInstalled!/s
const logRegexPowershellUninstall = /Edited files:\n- "(\/.*)" \((.*)\)\n- "\/.*\/tabtwo-test_completion_for_powershell.ps1" \(.*\)\nUninstalled!/s

const expectedBashCompletion = new RegExp([
    '--- BEGIN COMPLETION ---',
    '==> RESULT:',
    'argv_0___.*\/node',
    'argv_1___.*\/tabtwo-test',
    'argv_2___--shell-complete',
    'argv_3___--',
    'argv_4___tabtwo-test',
    'argv_5___something',
    'argv_6___part',
    'info0_complete___true',
    'info1_words___2',
    'info2_point___26',
    'info3_line___tabtwo-test something part',
    'info4_partial___tabtwo-test something part',
    'info5_last___part',
    'info6_lastPartial___part',
    'info7_prev___something',
    'opt1',
    'opt2',
    '--- END COMPLETION ---',
].join('(\r\n|\r|\n)+'), 's')

const expectedZshCompletion = new RegExp([
    '--- BEGIN COMPLETION ---',
    '==> RESULT:',
    'opt1 -- desc1',
    'opt2 -- desc2',
    'argv_0___.*\/node',
    'argv_1___.*\/tabtwo-test',
    'argv_2___--shell-complete',
    'argv_3___--',
    'argv_4___tabtwo-test',
    'argv_5___something',
    'argv_6___part',
    'argv_7___',
    'info0_complete___true',
    'info1_words___3',
    'info2_point___27',
    'info3_line___tabtwo-test something part',
    'info4_partial___tabtwo-test something part',
    'info5_last___',
    'info6_lastPartial___',
    'info7_prev___part',
    '--- END COMPLETION ---',
].join('(\r\n|\r|\n)+'), 's')

describe('Acceptance test', () => {
    let shellProfileFile, shellProfileHashBefore

    beforeAll(() => {
        if (!platformInfo.shell) {
            throw new Error('Cannot run if TEST_SHELL is not set')
        }
        if (!platformInfo.os) {
            throw new Error('Cannot run if TEST_OS is not set')
        }
        console.log(`Test will run for ${platformInfo.shell} on ${platformInfo.os}`)
        console.log(`ComSpec: ${process.env.ComSpec}`)
        console.log(`SHELL: ${process.env.SHELL}`)
        console.log(`HOME: ${process.env.HOME}`)
        console.log(`USERPROFILE: ${process.env.USERPROFILE}`)
        console.log(`BASH_ENV: ${process.env.BASH_ENV}`)
        console.log(`PROFILE: ${process.env.PROFILE}`)
        console.log(`ZDOTDIR: ${process.env.ZDOTDIR}`)
        console.log(`XDG_CONFIG_HOME: ${process.env.XDG_CONFIG_HOME}`)

        shelljs.cd(projectDir)
        exec('npm install -g')

        const result = exec('tabtwo-test install')
        console.log('Install test command done')

        if (platformInfo.shell === 'bash') {
            expect(result.stdout).toMatch(logRegexBashInstall)
            const match = logRegexBashInstall.exec(result.stdout)
            shellProfileFile = match[1]
            shellProfileHashBefore = match[2]
        } else if (platformInfo.shell === 'zsh') {
            expect(result.stdout).toMatch(logRegexZshInstall)
            const match = logRegexZshInstall.exec(result.stdout)
            shellProfileFile = match[1]
            shellProfileHashBefore = match[2]
        } else if (platformInfo.shell === 'ksh') {
            expect(result.stdout).toMatch(logRegexKshInstall)
            const match = logRegexKshInstall.exec(result.stdout)
            shellProfileFile = match[1]
            shellProfileHashBefore = match[2]
        } else if (platformInfo.shell === 'fish') {
            expect(result.stdout).toMatch(logRegexFishInstall)
            const match = logRegexFishInstall.exec(result.stdout)
            shellProfileFile = match[1]
            shellProfileHashBefore = match[2]
        } else if (platformInfo.shell === 'powershell') {
            expect(result.stdout).toMatch(logRegexPowershellInstall)
            const match = logRegexPowershellInstall.exec(result.stdout)
            shellProfileFile = match[1]
            shellProfileHashBefore = match[2]
        }
    })

    afterAll(async () => {
        shelljs.cd(projectDir)
        const result = exec('tabtwo-test uninstall')
        console.log('Uninstall test command done')

        if (platformInfo.shell === 'bash') {
            expect(result.stdout).toMatch(logRegexBashUninstall)
        } else if (platformInfo.shell === 'ksh') {
            expect(result.stdout).toMatch(logRegexKshUninstall)
        } else if (platformInfo.shell === 'zsh') {
            expect(result.stdout).toMatch(logRegexZshUninstall)
        } else if (platformInfo.shell === 'fish') {
            expect(result.stdout).toMatch(logRegexFishUninstall)
        } else if (platformInfo.shell === 'powershell') {
            expect(result.stdout).toMatch(logRegexPowershellUninstall)
        }

        const shellProfileContent = await fs.readFile(shellProfileFile, 'utf-8')
        const actualHash = crypto.createHash('sha256').update(shellProfileContent).digest('hex')
        expect(actualHash).toStrictEqual(shellProfileHashBefore)

        exec('npm uninstall -g')
    })

    test('dummy', () => {
        console.log(
            'Since tests are conditionally enabled, we need to ensure at least one test always exists to make jest happy.'
        )
    })

    if (platformInfo.shell === 'bash') {
        test(`${platformInfo.shell} completion on ${platformInfo.os}`, () => {
            const result = exec(`expect ${shellExpectFile('bash')} "tabtwo-test something part"`)

            expect(result.stdout).toMatch(expectedBashCompletion)
            expect(result.stderr).toStrictEqual('')
        })
    }

    if (platformInfo.shell === 'fish') {
        test(`${platformInfo.shell} completion on ${platformInfo.os}`, () => {
            const result = exec(`expect ${shellExpectFile('fish')} "tabtwo-test something part"`)

            expect(result.stdout).toMatch(expectedBashCompletion)
            expect(result.stderr).toStrictEqual('')
        })
    }

    if (platformInfo.shell === 'zsh') {
        test(`${platformInfo.shell} completion on ${platformInfo.os}`, () => {
            const result = exec(`expect ${shellExpectFile('zsh')} "tabtwo-test something part"`)

            result.stdout = result.stdout.replace(/\b/gu, '')
                .replace(/\u001b\[27m/gu, '')
                .replace(/\u001b\[J/gu, '')
                .replace(/\u001b\[10A/gu, '')
                .replace(/\u001b\[0m/gu, '')
                .replace(/\u001b\[24m/gu, '')
            result.stdout = result.stdout
                .replace(/ {3,}(?! *--)/g, '\r\n')
                .replace(/ +/g, ' ')
                .replace(/\r\n\r\n/g, '\r\n')

            expect(result.stdout).toMatch(expectedZshCompletion)
            expect(result.stderr).toStrictEqual('')
        })
    }

    if (platformInfo.shell === 'ksh') {
        test(`${platformInfo.shell} completion on ${platformInfo.os}`, () => {
            const result = exec(`expect ${shellExpectFile('ksh')} "tabtwo-test something part"`)

            expect(result.stdout).toMatch(expectedBashCompletion)
            expect(result.stderr).toStrictEqual('')
        })
    }

    if (platformInfo.shell === 'powershell') {
        test(`${platformInfo.shell} completion on ${platformInfo.os}`, () => {
            throw new Error('TODO')
        })
    }
})