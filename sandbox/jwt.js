const jwt = require('jsonwebtoken')

let myToken = jwt.sign({pk: 1234},"secretPassword",{expiresIn: '60 minutes'})
console.log('my Token is this man', myToken)

let myDecoded = jwt.verify(myToken,'secretPassword');
console.log('my decoded is this man', myDecoded)