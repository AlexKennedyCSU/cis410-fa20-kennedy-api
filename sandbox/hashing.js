const bcrypt = require('bcryptjs')
var hashedPW = bcrypt.hashSync('Leagueofl8')
console.log(hashedPW)

var hashTest = bcrypt.compareSync('Leagueofl8', hashedPW)
console.log("here da hashtest", hashTest)

