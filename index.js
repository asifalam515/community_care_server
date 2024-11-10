const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
var bodyParser = require("body-parser");
var cors = require("cors");
// use middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

// mongodb setup
// community_care
// 46XdsnIElPqWaa9c

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri =
  "mongodb+srv://community_care:46XdsnIElPqWaa9c@cluster0.6tngyrc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

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
    await client.connect();
    // DB and collections
    const database = client.db("communityDB");
    const users = database.collection("users");
    const volunteerNeedsCollection = database.collection("volunteerNeeds");
    const addVolunteerCollection = database.collection("addVolunteerPosts");

    // add volunteer post
    app.post("/addVolunteer", async (req, res) => {
      const post = req.body;
      const result = await volunteerNeedsCollection.insertOne(post);
      res.send(result);
    });

    // need volunteer  routes
    app.get("/volunteer", async (req, res) => {
      const options = {
        sort: { deadline: 1 },
      };
      const cursor = await volunteerNeedsCollection.find({}, options).toArray();
      res.send(cursor);
    });

    // get specific need volunteer post data
    app.get("/volunteer/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await volunteerNeedsCollection.findOne(query);
      res.send(result);
    });

    // create user using post
    app.post("/users", async (req, res) => {
      const newUser = req.body;

      const result = await users.insertOne(newUser);
      res.send(result);
    });
    // get the users data ,name ,email
    app.get("/users/:email", async (req, res) => {
      const userEmail = req.params.email;
      const query = {
        email: userEmail,
      };
      const options = {
        projection: { name: 1, email: 1, photo: 1 },
      };
      const result = await users.findOne(query, options);
      res.send(result);
    });

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

// server routes
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
