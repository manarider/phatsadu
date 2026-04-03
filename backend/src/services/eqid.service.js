const { Counter } = require('../models')
const { thaiYearShort } = require('../utils/helpers')

async function generateEqid(typeCode) {
  const yy = thaiYearShort(new Date())
  const key = `eqid:${typeCode}:${yy}`

  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  )

  const running = String(counter.seq).padStart(4, '0')
  return `${typeCode}-${yy}-${running}`
}

module.exports = {
  generateEqid,
}
