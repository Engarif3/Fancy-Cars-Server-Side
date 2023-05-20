const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// mongo db starts here

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.w8ykptm.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // create collection:
    const toysCollection = client.db("toyDB").collection("toys");

    const indexKeys = { toyName: 1 };
    const indexOptions = { name: "titleCategory" };
    const result = await toysCollection.createIndex(indexKeys, indexOptions);

    //api code starts
    app.post("/addToy", async (req, res) => {
      const body = req.body;
      const result = await toysCollection.insertOne(body);
      res.send(result);
    });

    // send all toys to All toys page.
    app.get("/allToys", async (req, res) => {
      const page = parseInt(req.query.page) || 0;
      const limit = parseInt(req.query.limit) || 20;
      const skip = page*limit;
      const result = await toysCollection.find().sort({price:1}).skip(skip).limit(limit).toArray();
      res.send(result);
    });

    // toys for my toy page
    app.get("/myToy", async (req, res) => {
      const userEmail = req.query.userId;
    
      const page = parseInt(req.query.page) || 0;
      const limit = parseInt(req.query.limit) || 20;
      const skip = page * limit;
    
      // Filter the toys collection by userEmail
      const result = await toysCollection
        .find({ sellerEmail: userEmail })
        .sort({ price: 1 })
        .skip(skip)
        .limit(limit)
        .toArray();
    
      res.send(result);
    });
    
    
    

    // to get a single toy info
    app.get("/myToy/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await toysCollection.findOne(filter);
      res.send(result);
    });

    // search by toy name
    app.get("/getToyByText/:text", async (req, res) => {
      const text = req.params.text;
      const result = await toysCollection
        .find({ toyName: { $regex: text, $options: "i" } })
        .toArray();
      res.send(result);
    });

    app.put("/updateToy/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const body = req.body;
      const updateToy = {
        $set: {
          photo: body.photo,
          toyName: body.toyName,
          sellerName: body.sellerName,
          sellerEmail: body.sellerEmail,
          price: body.price,
          rating: body.rating,
          quantity: body.quantity,
          details: body.details,
          selectedCategory: body.selectedCategory,
        },
      };
      const result = await toysCollection.updateOne(filter, updateToy);
      res.send(result);
    });


    app.delete("/myToy/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toysCollection.deleteOne(query);
      res.send(result);
    });
    // api code ends
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// mongo db ends here

app.listen(port, () => {
  console.log(`Server is running on port:${port}`);
});
