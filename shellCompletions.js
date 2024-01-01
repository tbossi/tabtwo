// TODO: compare with
//       - https://github.com/f/omelette/blob/master/src/omelette.js#L137
//       - https://github.com/mklabs/tabtab/tree/master/lib/scripts

const codeBegin = (program) => `###-begin-${program}-completion-###`
const codeEnd = (program) => `###-end-${program}-completion-###`
const disclaimer = `# This completion has been autogenerated by tabtwo
# Do not edit manually unless you know what you are doing!`

const bashCompletionInstallBlock = (program, completionScript) => `
${codeBegin(program)}
[ -f ${completionScript} ] && source ${completionScript} || true
${codeEnd(program)}
`
const bashCompletionSource = (program, completer) => `${codeBegin(program)}
${disclaimer}
if type complete &>/dev/null; then
    _${program}_completion () {
        local words cword
        if type _get_comp_words_by_ref &>/dev/null; then
            _get_comp_words_by_ref -n = -n @ -n : -w words -i cword
        else
            cword="$COMP_CWORD"
            words=("\${COMP_WORDS[@]}")
        fi

        local si="$IFS"
        IFS=$'\\n' COMPREPLY=($(COMP_CWORD="$cword" \\
                                COMP_LINE="$COMP_LINE" \\
                                COMP_POINT="$COMP_POINT" \\
                                ${completer} -- "\${words[@]}" \\
                                2>/dev/null)) || return $?
        IFS="$si"
        if type __ltrim_colon_completions &>/dev/null; then
            __ltrim_colon_completions "\${words[cword]}"
        fi
    }
    complete -o default -F _${program}_completion ${program}
fi
${codeEnd(program)}`

const kshCompletionInstallBlock = (program, completionScript) => `
${codeBegin(program)}
[ -f ${completionScript} ] && . ${completionScript} || true
${codeEnd(program)}
`
const kshCompletionSource = (program, completer) => `${codeBegin(program)}
${disclaimer}
if typeset -f complete &>/dev/null; then
    _${program}_completion () {
        typeset words cword
        if typeset -f _get_comp_words_by_ref &>/dev/null; then
            _get_comp_words_by_ref -n = -n @ -n : -w words -i cword
        else
            cword="$COMP_CWORD"
            words=("\${COMP_WORDS[@]}")
        fi

        typeset si="$IFS"
        IFS=$'\\n' COMPREPLY=($(COMP_CWORD="$cword" \
                                COMP_LINE="$COMP_LINE" \
                                COMP_POINT="$COMP_POINT" \
                                ${completer} completion -- "\${words[@]}" \
                                2>/dev/null)) || return $?
        IFS="$si"
        if typeset -f __ltrim_colon_completions &>/dev/null; then
            __ltrim_colon_completions "\${words[cword]}"
        fi
    }
    complete +o default -F _${program}_completion ${program}
fi
${codeEnd(program)}`

const fishCompletionInstallBlock = (program, completionScript) => `
${codeBegin(program)}
[ -f ${completionScript} ]; and source ${completionScript} or true
${codeEnd(program)}
`
const fishCompletionSource = (program, completer) => `${codeBegin(program)}
${disclaimer}
function _${program}_completion
    set cmd (commandline -o)
    set cursor (commandline -C)
    set words (node -pe "'$cmd'.split(' ').length")

    set completions (eval env DEBUG=\\"" \\"" COMP_CWORD=\\""$words\\"" COMP_LINE=\\""$cmd \\"" COMP_POINT=\\""$cursor\\"" ${completer} -- $cmd)

    for completion in $completions
        echo -e $completion
    end
end

complete -f -d '${program}' -c ${program} -a "(eval _${program}_completion)"
${codeEnd(program)}`

const zshCompletionInstallBlock = (program, completionScript) => `
${codeBegin(program)}
[[ -f ${completionScript} ]] && source ${completionScript} || true
${codeEnd(program)}
`
const zshCompletionSource = (program, completer) => `${codeBegin(program)}
${disclaimer}
if type compdef &>/dev/null; then
    _${program}_completion () {
        local reply
        local si=$IFS

        IFS=$'\\n' reply=($(COMP_CWORD="$((CURRENT-1))" COMP_LINE="$BUFFER" COMP_POINT="$CURSOR" ${completer} -- "\${words[@]}"))
        IFS=$si

        _describe 'values' reply
    }
    compdef _${program}_completion ${program}
fi
${codeEnd(program)}`

const powershellCompletionInstallBlock = (program, completionScript) => `
${codeBegin(program)}
if (Test-Path "${completionScript}") {
    . "${completionScript}"
}
${codeEnd(program)}
`
const powershellCompletionSource = (program, completer) => `${codeBegin(program)}
${disclaimer}
function ${program}-completion {
    param (
        $WordToComplete,
        $CommandAst,
        $CursorPosition
    )

    filter __escapeSpecialChars {
        $_ -replace '\\s|#|@|\\$|;|,|''|\\{|\\}|\\(|\\)|"|\`|\||<|>|&','\`$&'
    }

    $Command = $CommandAst.CommandElements
    $Command = "$Command"
    if ($Command.Length -gt $CursorPosition) {
        $Command=$Command.Substring(0, $CursorPosition)
    }

    $WordCount = $Command.Split(" ").Count - 1
    $env:COMP_CWORD = $WordCount
    $env:COMP_POINT = $CursorPosition
    $env:COMP_LINE = $Command
    
    Invoke-Expression -OutVariable out "${completer} \"$WordToComplete\"" 2>&1 | Out-Null

    $Longest = 0
    $Values = $Out | ForEach-Object {
        $Name, $Description = $_.Split("\`t",2)

        if ($Longest -lt $Name.Length) {
            $Longest = $Name.Length
        }

        if (-Not $Description) {
            $Description = " "
        }
        @{Name="$Name";Description="$Description"}
    }

    $Mode = (Get-PSReadLineKeyHandler | Where-Object {$_.Key -eq "Tab" }).Function

    $Values | ForEach-Object {
        $comp = $_

        # PowerShell supports three different completion modes
        # - TabCompleteNext (default windows style - on each key press the next option is displayed)
        # - Complete (works like bash)
        # - MenuComplete (works like zsh)

        switch ($Mode) {
            "Complete" {
                if ($Values.Length -eq 1) {
                    [System.Management.Automation.CompletionResult]::new($($comp.Name | __escapeSpecialChars) + $Space, "$($comp.Name)", 'ParameterValue', "$($comp.Description)")
                } else {
                    while($comp.Name.Length -lt $Longest) {
                        $comp.Name = $comp.Name + " "
                    }

                    if ($($comp.Description) -eq " " ) {
                        $Description = ""
                    } else {
                        $Description = "  ($($comp.Description))"
                    }

                    [System.Management.Automation.CompletionResult]::new("$($comp.Name)$Description", "$($comp.Name)$Description", 'ParameterValue', "$($comp.Description)")
                }
            }

            "MenuComplete" {
                [System.Management.Automation.CompletionResult]::new($($comp.Name | __escapeSpecialChars) + $Space, "$($comp.Name)", 'ParameterValue', "$($comp.Description)")
            }

            Default {
                [System.Management.Automation.CompletionResult]::new($($comp.Name | __escapeSpecialChars), "$($comp.Name)", 'ParameterValue', "$($comp.Description)")
            }
        }
    }
}

Register-ArgumentCompleter -Native -CommandName ${program} -ScriptBlock ${program}-completion
${codeEnd(program)}
`

export const completions = {
    bash: (program, scriptPath, completer) => ({
        source: bashCompletionSource(program, completer),
        installBlock: bashCompletionInstallBlock(program, scriptPath),
    }),
    fish: (program, scriptPath, completer) => ({
        source: fishCompletionSource(program, completer),
        installBlock: fishCompletionInstallBlock(program, scriptPath),
    }),
    zsh: (program, scriptPath, completer) => ({
        source: zshCompletionSource(program, completer),
        installBlock: zshCompletionInstallBlock(program, scriptPath),
    }),
    ksh: (program, scriptPath, completer) => ({
        source: kshCompletionSource(program, completer),
        installBlock: kshCompletionInstallBlock(program, scriptPath),
    }),
    powershell: (program, scriptPath, completer) => ({
        source: powershellCompletionSource(program, completer),
        installBlock: powershellCompletionInstallBlock(program, scriptPath),
    }),
    csh: (_program, _scriptPath, _completer) => {
        throw new Error('not supported')
    },
    tcsh: (_program, _scriptPath, _completer) => {
        throw new Error('not supported')
    },
    cmd: (_program, _scriptPath, _completer) => {
        throw new Error('cmd does not support tab completion')
    },
    // TODO: elvish, xonsh, nushell?
}

export const installBlockCheckRegex = (program) => new RegExp(`\n${codeBegin(program)}\n.*?\n${codeEnd(program)}\n`, 'gs')

export const getCompletionInfo = (env) => {
    let cword = Number(env.COMP_CWORD)
    if (Number.isNaN(cword)) {cword = 0}

    let point = Number(env.COMP_POINT)
    if (Number.isNaN(point)) {point = 0}

    const line = env.COMP_LINE || ''

    const partial = line.slice(0, point)

    const parts = line.split(' ')
    const prev = parts.slice(0, -1).slice(-1)[0]

    const last = parts.slice(-1).join('')
    const lastPartial = partial.split(' ').slice(-1).join('')

    let complete = true
    if (!env.COMP_CWORD || !env.COMP_POINT || !env.COMP_LINE) {
        complete = false
    }

    return {complete, words: cword, point, line, partial, last, lastPartial, prev}
}