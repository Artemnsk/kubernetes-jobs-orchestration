async function memoryJob() {
    const bytes = parseInt(process.env.BYTES, 10)
    if (typeof bytes !== 'number' || isNaN(bytes)) {
        throw new Error('Invalid BYTES parameter')
    }

    await new Promise(r => setTimeout(r, 15_000))
    // If memory is not enough, this place is supposed to throw OOM error.
    Buffer.alloc(bytes)
}

memoryJob().then(() => {
    console.log(`Memory Job with foo="${process.env.FOO}" is done.`)
    process.exit(0)
}, (e) => {
    console.error(`Memory Job with foo="${process.env.FOO}" has error: `, e)
    process.exit(1)
})
