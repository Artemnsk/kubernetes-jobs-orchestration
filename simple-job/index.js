function simpleJob() {
    return new Promise(r => setTimeout(r, 15_000))
}

simpleJob().then(() => {
    if (process.env.FAIL) {
        throw new Error('job failed as requested in "fail" parameter')
    }
    console.log(`Simple Job with foo="${process.env.FOO}" is done.`)
    process.exit(0)
}, (e) => {
    console.error(`Simple Job with foo="${process.env.FOO}" has error: `, e)
    process.exit(1)
})
