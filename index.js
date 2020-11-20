const express = require('express')

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cors = require('cors')

const db = require('./dbConnectExec.js')

const config = require('./config.js')
const auth = require('./middleware/authenticate')

//azurewebsites.net , colostate.edu
const app = express();
app.use(express.json())

app.use(cors())

app.post('/Customers_T/logout', auth, (req,res)=>{
var logoutQuery= `
UPDATE Customers_T
SET Token = NULL
WHERE CustomerID = ${req.contact.CustomerID}`

db.executeQuery(logoutQuery)
.then(()=>{res.status(200).send()})
.catch((error)=>{
    console.log("error in POST Customers_T/logout",error)
res.status(500).send()
})

})

app.get("/", (req,res)=>{res.send("hi world this is my home point! by Alex !")})

app.get('/Customers_T/me', auth, (req,res)=>{
    res.send(req.contact)
    console.log(req.contact.Name)
    console.log(req.contact.Email)
    console.log(req.contact.CustomerID)
})
app.get("/hi",(req,res)=>{
    res.send("hello world")

})



app.post("/myorders", auth, async (req,res)=>{
   try{
    var custID= req.body.CustomerID
    var orderDate= req.body.OrderDate
    var delDate = req.body.DeliveryDate
    var shipAddress = req.body.ShipAddress
    var knifeID = req.body.KnifeID
   
if(!custID){res.status(400).send("bad request no cust id provided")}
// console.log("turtles",req.contact)
// res.send("here is yo response")

let insertQuery = `SELECT OrderDate,DeliveryDate,ShipAddress,CustomerID,KnifeID
FROM Orders_T
WHERE CustomerID=${custID};`

let insertedOrders = await db.executeQuery(insertQuery);

console.log("this is the all the records for custid we need", insertedOrders)
res.status(201).send(insertedOrders)


}
   
   catch(error){
       console.log("error in post/myorders", error)
       res.status(500).send()
   }
})



app.post("/Customers_T/login", async (req,res)=>{

    console.log('/Customers_T/login is called by aldog thus route is active genius')
    //console.log(req.body)

    var Email = req.body.Email
    var Password = req.body.Password
    var Token = req.body.Token
    if (!Email || !Password){
    return res.status(400).send('bad frick request brotha')}

    //1 check that user email exists in db


    var query = `SELECT *
    FROM Customers_T
    WHERE Email = '${Email}'`

  
let result;

    try{
        result = await db.executeQuery(query);

    }catch(myError){
console.log('error in /contacts/login:',myError)
return res.status(500).send()
    }
    console.log(result)

    if (!result[0]){return res.status(400).send("invalid user credentials my man")}




    //2 check that their password matches

let user = result[0]
console.log("this is user", user)
if (!bcrypt.compareSync(Password,user.Password)){
    console.log("invalid password")
    return res.status(400).send("Invalid passwordzz")
}

    //3 generate a token for them
  let token=  jwt.sign({pk: user.CustomerID},config.JWT,{expiresIn: '60 minutes'})
    console.log(token)

    //4 save the token in db and send token and user info back to user

    let setTokenQuery = `UPDATE Customers_T
    SET Token= '${token}'
    WHERE CustomerID = ${user.CustomerID}`

    try{
        await db.executeQuery(setTokenQuery)

        res.status(200).send({
            token: token,
            user: {
                Name: user.Name,
                Email: user.Email,
                CustomerID: user.CustomerID
            }
        })
    }
    catch(myError){
        console.log("error setting the user token :/", myError)
        res.status(500).send()
    }


})

app.post("/order", auth, async (req,res)=>{

    try{ 
        
        var orderDate = req.body.OrderDate
        var delDate = req.body.DeliveryDate
        var shipAddress = req.body.ShipAddress
        var knifeID = req.body.KnifeID
        if (!orderDate||!delDate||!shipAddress||!knifeID)  {res.status(400).send("bad request- you entered an invalid:  order date/ delivery date/address/knife id")}
        shipAddress = shipAddress.replace("'","''")

        let orderQuery =`INSERT INTO Orders_T(OrderDate,DeliveryDate,ShipAddress,CustomerID,KnifeID)
        OUTPUT inserted.OrderID, inserted.OrderDate, inserted.CustomerID, inserted.KnifeID
        VALUES ('${orderDate}','${delDate}','${shipAddress}',${req.contact.CustomerID},${knifeID})`

        let insertedOrder = await db.executeQuery(orderQuery);
       console.log(insertedOrder)
       res.status(201).send(insertedOrder[0])
    }
     

        

        catch(error){
            console.log("error in POST /order",error);
            res.status(500).send()
        }

})

app.post("/Customers_T",async (req,res)=>{



    //res.send("Creating user big dog")
    console.log("request body", req.body)

    var Name = req.body.Name
    var Phone = req.body.Phone
    var Address = req.body.Address
    var Email = req.body.Email
    var Password = req.body.Password
    var Token = req.body.Token
//check if web server sending values for name, email, pw
    if (!Name|| !Email|| !Password||!Address||!Phone){
        return res.status(400).send("bad request my dude")
    }
    //replace names containing ' with '' for sql syntax
    Name=Name.replace("'","''")

    var emailCheck = `SELECT Email
    FROM Customers_T
    WHERE Email = '${Email}'`
   var existingUser = await db.executeQuery(emailCheck)
   console.log("existng user broski", existingUser)

   if(existingUser[0]){
       return res.status(409).send("please enter diff email broski")
   }

   var hashedPassword = bcrypt.hashSync(Password)
   var insertQuery = `INSERT INTO Customers_T(Name,Email,Password)
   VALUES('${Name}','${Email}','${hashedPassword}')`
   db.executeQuery(insertQuery)
   .then(()=>{res.status(201).send()})
   .catch((err)=>{
       console.log("Error in POST/customers_T",err)
       res.status(500).send()

   })
})

app.get("/knifetype",(req,res)=>{
//get data from database
db.executeQuery(`SELECT * FROM KnifesType_T`)
.then((result)=>{
    res.status(200).send(result)
})
.catch((err)=>{
    console.log(err)
    res.status(500).send()
})

})

app.get("/knifes",(req,res)=>{
    //get data from database
    db.executeQuery(`SELECT KnifeID, UnitPrice, AvailableStock, KnifeName, KnifesType_T.TypeID, KnifesType_T.TypeName, KnifesType_T.TypeDescription
    FROM Knife_T
    LEFT JOIN KnifesType_T
    ON KnifesType_T.TypeID = Knife_T.TypeID`)
    .then((result)=>{
        res.status(200).send(result)
    })
    .catch((err)=>{
        console.log(err)
        res.status(500).send()
    })
    
    })

    app.get("/knifes/:pk",(req,res)=>{
        var pk = req.params.pk
        
      
        var myQuery = `SELECT KnifeID, UnitPrice, AvailableStock, KnifeName, KnifesType_T.TypeID, KnifesType_T.TypeName, KnifesType_T.TypeDescription
        FROM Knife_T
        LEFT JOIN KnifesType_T
        ON KnifesType_T.TypeID = Knife_T.TypeID
        WHERE KnifeID = ${pk}`
        
        db.executeQuery(myQuery).then((movies)=>{
        
            
        
            if (movies[0]){
                res.send(movies[0])
            }else{res.status(404).send('bad request')}
        }).catch((err)=>{
            console.log("Error in /knifes/pk", err)
            res.status(500).send()
        })
        
        })

app.get("/knifetype/:pk",(req,res)=>{
var pk = req.params.pk


var myQuery = `SELECT *
FROM KnifesType_T
WHERE TypeID = ${pk}`

db.executeQuery(myQuery).then((movies)=>{

    //console.log("knifes : ", movies)

    if (movies[0]){
        res.send(movies[0])
    }else{res.status(404).send('bad request')}
}).catch((err)=>{
    console.log("Error in /knifetype/pk", err)
    res.status(500).send()
})

})

const PORT = process.env.PORT || 5000
app.listen(PORT,()=>{console.log(`app is running on ${PORT}`)})