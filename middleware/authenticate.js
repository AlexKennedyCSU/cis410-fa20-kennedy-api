const jwt = require('jsonwebtoken')
const db = require('../dbConnectExec.js')
const config = require('../config.js')
const auth = async(req,res,next)=>{
    //console.log(req.header('Authorization'))
    try{

//1 decode token

let myToken =  req.header('Authorization').replace('Bearer ','')
console.log(myToken)

let decodedToken = jwt.verify(myToken,config.JWT)
//console.log(decodedToken)

let customerID = decodedToken.pk;
console.log("yoooo",customerID)
//2 compare token with db token

let query = `SELECT CustomerID, Name, Email, Password, Token
FROM Customers_T
WHERE CustomerID= ${customerID} AND Token = '${myToken}'`

let returnUser= await db.executeQuery(query)
//console.log(returnUser)
//3 save user information in request
if(returnUser[0]){
    req.contact = returnUser[0];
  
    next()
}
else{res.status(401).sned("Authentication has failed mon.")}
    }catch(myError){

res.status(401).send("Authentication failed senpaiz.")
    }
}

module.exports = auth