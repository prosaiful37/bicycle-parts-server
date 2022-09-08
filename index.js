const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.i1h9duf.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const partsCollection = client.db("bicycle_parts").collection("parts");
    const ordersCollection = client.db("bicycle_parts").collection("orders");
    const paymentsCollection = client.db("bicycle_parts").collection("payment");
    const reviewsCollection = client.db("bicycle_parts").collection("review");
    const usersCollection = client.db("bicycle_parts").collection("users");


    //get all users
    app.get('/users', async(req, res) => {
      const users = await usersCollection.find().toArray();
      res.send(users);
    })

    app.put('/users/:email', async(req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = {email: email}
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);

    })



    // get all parts data
    app.get("/parts", async (req, res) => {
      const query = {};
      const cursor = partsCollection.find(query);
      const parts = await cursor.toArray();
      res.send(parts);
    });

    app.get("/parts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const part = await partsCollection.findOne(query);
      res.send(part);
    });

    // manage order
    app.post("/orders", async (req, res) => {
      const order = req.body;
      const result = ordersCollection.insertOne(order);
      res.send(result);
    });

    app.get("/orders", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const orders = await ordersCollection.find(query).toArray();
      res.send(orders);
    });

    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const order = await ordersCollection.deleteOne(query);
      res.send(order);
    });

    app.get("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const order = await ordersCollection.findOne(query);
      res.send(order);
    });


    
    // all review get api
    app.get("/reviews", async (req, res) => {
      const query = {};
      const cursor = reviewsCollection.find(query);
      const review = await cursor.toArray();
      res.send(review);
    });



    // reviews single add api for post
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });

    app.patch("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          paid: true,
          transctionId: payment.transctionId,
        },
      };

      const result = await paymentsCollection.insertOne(payment);
      const ordersUpdate = await ordersCollection.updateOne(filter, updateDoc);
      res.send(updateDoc);
    });

    // payments method
    app.post("/create-payment-intent", async (req, res) => {
      const order = req.body;
      const price = order.price;
      const amount = price * 100;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from bicycle parts manufacture !");
});

app.listen(port, () => {
  console.log(`Example app gym equipment listening on port  ${port}`);
});
