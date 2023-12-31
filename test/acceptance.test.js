import { fileURLToPath } from 'node:url'
import * as path from 'node:path'
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

describe('Acceptance test', () => {

    beforeAll(() => {
        /* TODO:
            1. On Linux/maxOS check expect is installed (/usr/bin/expect) (https://phoenixnap.com/kb/linux-expect)
            2. On windows install Pester?
        */

        shelljs.cd(projectDir)
        exec('npm install -g')

        const result = exec('tabtwo-test install')
        console.log('Install test command done')

        if (platformInfo.shell === 'bash') {
            expect(result.stdout).toMatch(/Edited files:\n- \/.*\/\.bashrc\n- \/.*\/tabtwo-test_completion.sh\nInstalled!/s)
        }
    })

    afterAll(() => {
        shelljs.cd(projectDir)
        const result = exec('tabtwo-test uninstall')
        console.log('Uninstall test command done')

        //TODO: also check shell profile is correctly reverted

        if (platformInfo.shell === 'bash') {
            expect(result.stdout).toMatch(/Edited files:\n- \/.*\/\.bashrc\n- \/.*\/tabtwo-test_completion.sh\nUninstalled!/s)
        }

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
                'argv_0___.*\/node',
                'argv_1___.*\/tabtwo-test',
                'argv_2___--shell-complete',
                'argv_3___--',
                'argv_4___tabtwo-test',
                'argv_5___something',
                'argv_6___part',
                'info_complete___true',
                'info_last___part',
                'info_lastPartial___part',
                'info_line___tabtwo-test something part',
                'info_partial___tabtwo-test something part',
                'info_point___26',
                'info_prev___something',
                'info_words___2',
                'opt1',
                '--- END COMPLETION ---',
            ].join('\n'), 's')

            expect(result.stdout).toMatch(expected)
            expect(result.stderr).toStrictEqual('')
        })
    }
})