function simpleJob() {
    return new Promise(r => setTimeout(r, 10_000))
}

simpleJob().then(() => {
    console.log('Job is done')
    process.exit(0)
}, (e) => {
    console.error('Some error occurred: ', e)
    process.exit(1)
})
