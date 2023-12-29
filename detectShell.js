import * as os from 'node:os'
import * as path from 'node:path'

function getCurrentShell(env) {
    switch (os.platform()) {
        case 'win32':
            return env.ComSpec || 'cmd.exe'
        case 'darwin':
            return env.SHELL || '/bin/bash'
        case 'linux':
            return env.SHELL || '/bin/sh'
        case 'aix':
            return env.SHELL || '/bin/ksh'
        case 'freebsd':
            return env.SHELL || '/bin/sh'
        case 'openbsd':
            return env.SHELL || '/bin/ksh'
        case 'sunos':
            return env.SHELL || '/bin/ksh'
        case 'android':
            return env.SHELL || '/system/bin/sh'
        default:
            return env.SHELL
    }
}

export function detectShell(env) {
    const shellExecutable = getCurrentShell(env)
    const detection = shellExecutable.toLowerCase()
    let shellType
    let configFile
    if (detection.includes('cmd')) {
        shellType = 'cmd'
        configFile = 'AutoRun.cmd'
    } else if (detection.includes('powershell') || detection.includes('pwsh')) {
        shellType = 'powershell'
        configFile = os.platform() === 'win32'
            ? 'Documents\\PowerShell\\Microsoft.PowerShell_profile.ps1'
            : '.config/powershell/Microsoft.PowerShell_profile.ps1'
    } else if (detection.includes('bash')) {
        shellType = 'bash'
        configFile = os.platform() === 'darwin' ? '.bash_profile' : '.bashrc'
    } else if (detection.includes('zsh')) {
        shellType = 'zsh'
        configFile = '.zshrc'
    } else if (detection.includes('fish')) {
        shellType = 'fish'
        configFile = '.config/fish/config.fish'
    } else if (detection.includes('ksh')) {
        shellType = 'ksh'
        configFile = '.kshrc'
    } else if (detection.includes('tcsh')) {
        shellType = 'tcsh'
        configFile = '.tcshrc'
    } else if (detection.includes('csh')) {
        shellType = 'csh'
        configFile = '.cshrc'
    } else if (detection.includes('sh')) {
        shellType = 'sh'
        configFile = '.profile'
    }

    return {
        executable: shellExecutable,
        type: shellType || null,
        configFile: configFile ? path.join(env.HOME || env.USERPROFILE, configFile) : null,
    }
}