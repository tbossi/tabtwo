import { fileURLToPath } from 'node:url'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import * as crypto from 'node:crypto'
import shelljs from 'shelljs'

const projectDir = path.join(fileURLToPath(import.meta.url), '../..')
const shellExpectFile = path.join(projectDir, 'test', 'acceptance-script', 'acceptance.exp')

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

const logRegexBashInstall = /Edited files:\n- "(\/.*\/\.bashrc)" \((.*)\)\n- "\/.*\/tabtwo-test_completion_for_bash.sh" \(.*\)\nInstalled!/s
const logRegexBashUninstall = /Edited files:\n- "(\/.*\/\.bashrc)" \((.*)\)\n- "\/.*\/tabtwo-test_completion_for_bash.sh" \(.*\)\nUninstalled!/s

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
        /* TODO:
            1. On Linux/maxOS check expect is installed (/usr/bin/expect) (https://phoenixnap.com/kb/linux-expect)
            2. On windows install Pester?
        */

        shelljs.cd(projectDir)
        exec('npm install -g')

        const result = exec('tabtwo-test install')
        console.log('Install test command done')

        if (platformInfo.shell === 'bash') {
            expect(result.stdout).toMatch(logRegexBashInstall)
            const match = logRegexBashInstall.exec(result.stdout)
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
            const result = exec(`expect ${shellExpectFile} "bash -i" "tabtwo-test something part"`)

            const expected = new RegExp([
                '--- BEGIN COMPLETION ---',
                '==> RESULT:',
                '',
                'argv_0___.*\/node\r',
                'argv_1___.*\/tabtwo-test\r',
                'argv_2___--shell-complete\r',
                'argv_3___--\r',
                'argv_4___tabtwo-test\r',
                'argv_5___something\r',
                'argv_6___part\r',
                'info_complete___true\r',
                'info_last___part\r',
                'info_lastPartial___part\r',
                'info_line___tabtwo-test something part\r',
                'info_partial___tabtwo-test something part\r',
                'info_point___26\r',
                'info_prev___something\r',
                'info_words___2\r',
                'opt1\r',
                'opt2',
                '--- END COMPLETION ---',
            ].join('\n'), 's')

            expect(result.stdout).toMatch(expected)
            expect(result.stderr).toStrictEqual('')
        })
    }
})