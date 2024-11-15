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
    const volunteerRequestsCollection = database.collection(
      "volunteerRequestsCollection"
    );

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
    // UPDATE
    app.post("/volunteer/request", async (req, res) => {
      const {
        thumbnail,
        title,
        description,
        category,
        location,
        number,
        deadline,
        organizer,
        organizerEmail,
        volunteerName,
        volunteerEmail,
        suggestion,
      } = req.body;

      // Convert number to a numeric type
      const numericNumber = parseInt(number, 10);

      // Create a new volunteer request
      const newRequest = {
        thumbnail,
        title,
        description,
        category,
        location,
        number: numericNumber,
        deadline,
        organizer,
        organizerEmail,
        volunteerName,
        volunteerEmail,
        suggestion,
        status: "requested",
      };

      try {
        await volunteerRequestsCollection.insertOne(newRequest);
        // Update the post to decrease the number of volunteers needed
        await volunteerNeedsCollection.updateOne(
          { title }, // Assuming the post can be identified by title
          { $inc: { number: -1 } }
        );
        res
          .status(201)
          .json({ message: "Volunteer request submitted successfully" });
      } catch (error) {
        console.error("Error submitting volunteer request", error);
        res.status(500).json({ message: "Error submitting volunteer request" });
      }
    });

    // for update extra code
    const updateNumberField = async () => {
      try {
        const documents = await volunteerNeedsCollection.find({}).toArray();
        for (const doc of documents) {
          const numericNumber = parseInt(doc.number, 10);
          await volunteerNeedsCollection.updateOne(
            { _id: doc._id },
            { $set: { number: numericNumber } }
          );
        }
        console.log("All documents updated successfully.");
      } catch (error) {
        console.error("Error updating documents", error);
      }
    };

    updateNumberField();

    // implement search functionality
    app.get("/volunteer/search", async (req, res) => {
      const query = req.query.q;
      const result = await volunteerNeedsCollection
        .find({
          $text: { $search: query },
        })
        .toArray();
      res.json(result);
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

    // manage my Post::::
    app.get("/needVolunteerPost/:email", async (req, res) => {
      const userEmail = req.params.email;
      const query = { "user.email": userEmail };
      const result = await volunteerNeedsCollection.find(query).toArray();
      res.send(result);
    });

    // update my post api::
    // step 1 :get the specific id wala post
    app.get("/update/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await volunteerNeedsCollection.findOne(query);
      res.send(result);
    });
    app.put("/update/:id", async (req, res) => {
      const id = req.params.id;
      const updatedPost = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          thumbnail: updatedPost.thumbnail,
          title: updatedPost.title,
          category: updatedPost.category,
          deadline: updatedPost.deadline,
          number: updatedPost.number,
          organizer: updatedPost.organizer,
          organizerEmail: updatedPost.organizerEmail,
          location: updatedPost.location,
        },
      };
      const result = await volunteerNeedsCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // delete any posts you want:
    app.delete("/post/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await volunteerNeedsCollection.deleteOne(query);
      res.send(result);
    });

    // volunteer request cancel options  :
    app.get("/volunteerRequest", async (req, res) => {
      const result = await volunteerRequestsCollection.find().toArray();
      res.send(result);
    });
    // cancel volunteer request:
    app.delete("/volunteerRequest/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await volunteerRequestsCollection.deleteOne(query);
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
