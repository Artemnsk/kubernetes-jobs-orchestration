function simpleJob() {
    return new Promise(r => setTimeout(r, 10_000))
}

simpleJob().then(() => {
    console.log(`Job for live event ${process.env.LIVE_EVENT_ID} is done.`)
    process.exit(0)
}, (e) => {
    console.error(`Job for live event ${process.env.LIVE_EVENT_ID} has error: `, e)
    process.exit(1)
})
