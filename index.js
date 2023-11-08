const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const morgan = require("morgan");
//middleware
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(morgan("dev"));
console.log(process.env.DB_PASS);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.m8c8ayj.mongodb.net/?retryWrites=true&w=majority`;

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
    // await client.connect();

    const roomsCollection = client.db("SuiteSparkle").collection("rooms");
    const bookingsCollection = client.db("SuiteSparkle").collection("bookings");
    // rooms query

    app.get("/rooms", async (req, res) => {
      const rooms = await roomsCollection.find({}).toArray();
      res.send(rooms);
    });

    app.get("/rooms/:id", async (req, res) => {
      const id = req.params.id;

      try {
        const room = await roomsCollection.findOne({ _id: new ObjectId(id) });

        if (room) {
          res.send(room);
        } else {
          res.status(404).json({ error: "Room not found" });
        }
      } catch (error) {
        console.error("Error fetching room:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // update is Booking

    app.patch("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const { isBooked } = req.body;

      const query = { _id: new ObjectId(id) };
      const updatedStatus = {
        $set: {
          isBooked,
        },
      };
      const updateStatus = await roomsCollection.updateOne(
        query,
        updatedStatus
      );
      res.send(updateStatus);
    });

    app.get("/mybookings/:email", async (req, res) => {
      const email = req.params.email;
      const query = {
        email: email,
      };
      const result = await bookingsCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/mybookings", async (req, res) => {
      const data = req.body;
      const postData = await bookingsCollection.insertOne(data);
      res.send(postData);
    });

    app.patch("/mybookings/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const { status, bookingDate } = req.body;

      const updateDoc = {
        $set: {
          status: status,
          bookingDate,
        },
      };
      const result = await bookingsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete("/mybookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      try {
        const result = await bookingsCollection.deleteOne(query);

        if (result.deletedCount > 0) {
          res.status(200).json({ message: "Booking deleted successfully" });
        } else {
          res.status(404).json({ error: "Booking not found" });
        }
      } catch (error) {
        console.error("Error deleting booking:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

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

app.get("/", (req, res) => {
  res.send("Server is Running");
});

app.listen(port, () => {
  console.log(`Server is Running on port ${port}`);
});
