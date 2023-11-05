const express = require('express')
const app = express();
const port = process.env.PORT || 3001;


app.get('/',(req, res)=>{
    res.send('Hotel Management Server Is Running')
})

app.listen(port, ()=>
{
    console.log(`Listening ${port}`)
})