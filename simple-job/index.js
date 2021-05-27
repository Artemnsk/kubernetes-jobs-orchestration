function simpleJob() {
    return new Promise(r => setTimeout(r, 15_000))
}

simpleJob().then(() => {
    console.log(`Job with foo="${process.env.FOO}" is done.`)
    process.exit(0)
}, (e) => {
    console.error(`Job with foo="${process.env.FOO}" has error: `, e)
    process.exit(1)
})
