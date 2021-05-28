async function memoryJob() {
    const allocBytes = parseInt(process.env.ALLOC_BYTES, 10)
    if (typeof allocBytes !== 'number' || isNaN(allocBytes)) {
        throw new Error('Invalid ALLOC_BYTES parameter')
    }

    await new Promise(r => setTimeout(r, 7_000))
    // If memory is not enough, this place is supposed to throw OOM error.
    Buffer.alloc(allocBytes, 'a')
    await new Promise(r => setTimeout(r, 8_000))
}

memoryJob().then(() => {
    console.log(`Memory Job with foo="${process.env.FOO}" is done.`)
    process.exit(0)
}, (e) => {
    console.error(`Memory Job with foo="${process.env.FOO}" has error: `, e)
    process.exit(1)
})
