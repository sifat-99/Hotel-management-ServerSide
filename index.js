const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5001;

// middleware

app.use(cors(
  {
    origin: ['https://hotel-relax.web.app', 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  }
));

app.use(cookieParser());


app.use(express.json());

// console.log(process.env.DB_USER)
// console.log(process.env.DB_PASSWORD)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.kysojnx.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Middlewares
const logger = (req, res, next) => {
  console.log('Logging...');
  next();
}

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if(!token) return res.sendStatus(403);
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if(err) return res.sendStatus(403).send({message: 'Unauthorized'});
      req.user = decoded;
      next();
  }
  )
}


async function run() {
  try {
    // await client.connect();


    // For JWT
     
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.JWT_SECRET,{expiresIn: '1h'} );
      res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none' })
      .send({success: true});
      
  }
  );
  app.post('/logout', async (req, res) => {
    console.log('Logging out')
    res.clearCookie('token', {maxAge: 0}).send({success: true});
  }
  );




    // For Service

    app.post('/services', async (req, res) => {
        const product = req.body;
        // console.log(product)
        const result = await client.db("HotelRelax").collection("services").insertOne(product);
        // console.log(result)
        res.send(result);
    });
    app.post('/subscribe', async (req, res) => {
        const User = req.body;
        // console.log(User)
        const result = await client.db("HotelRelax").collection("Subscriber").insertOne(User);
        // console.log(result)
        res.send(result);
    });



    app.post('/bookings', async (req, res) => {
        const product = req.body;
        // console.log(product)
        const result = await client.db("HotelRelax").collection("BookingCart").insertOne(product);
        // console.log(result)
        res.send(result);
    });

    app.get('/booking',logger,verifyToken, async (req, res) => {
      console.log(req.cookies)
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const cursor = await client.db("HotelRelax").collection("BookingCart").find(query).toArray();
      res.send(cursor);
  }
  );


    app.get('/rooms',logger,verifyToken, async (req, res) => {
        const cursor = client.db("HotelRelax").collection("services").find({});
        const rooms = await cursor.toArray();
        res.send(rooms);
    }
    );
    // get single room from id
    app.get('/:id', async (req, res) => {
        const id = req.params.id;
        // console.log(id)
        const query = { Category: id };
        const room = await client.db("HotelRelax").collection("services").findOne(query);
        res.send(room);
    });

    // Update single product from id
    app.put('/services/:id', async (req, res) => {
      const id = req.params.id;
      const updatedProduct = req.body;

      const filter = { Category: id };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          Remaining: updatedProduct.Remaining,
        },
      };
      const result = await client.db("HotelRelax").collection("services").updateOne(filter, updateDoc, options);

      res.send(result);

    })
    app.put('/services/rating/:id', async (req, res) => {
      const id = req.params.id;
      const updatedProduct = req.body;
      console.log('updating product', id)
      const filter = { Category: id };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          Rating: updatedProduct.Rating,
        },
      };
      const result = await client.db("HotelRelax").collection("services").updateOne(filter, updateDoc, options);
      
      res.send(result);
    })
    app.delete('/booking/:id', async (req, res) => {
      const id = req.params.id;
      // console.log(id)
      console.log('deleting product', id)
      const query = {_id : new ObjectId(id)};
      const result = await client.db("HotelRelax").collection("BookingCart").deleteOne(query);

      res.send(result);
    })

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


// routes

app.get('/', (req, res) => {
    res.send('Here is the main api... go to /products for the products!');
    });

    


// listen

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
    });