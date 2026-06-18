const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    console.log("✅ MongoDB Connected");

    const database = client.db("Fable-Ebook-Sharing-Platform");
    const booksCollection = database.collection("books");


    app.get("/api/books", async (req, res) => {
      const query = {};
      if(req.query.genre){ 
        query.genre = req.query.genre;
      }

      const cursor = booksCollection.find(query);
      const books = await cursor.toArray();
      res.send(books);



    });

    app.get("/api/books/:id", async (req, res) => {
      const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            }
            const result = await booksCollection.findOne(query);
            res.send(result);
    });

    app.post("/api/books", async (req, res) => {
      try {
        const book = req.body;

        const result = await booksCollection.insertOne(book);

        res.status(201).send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });

    app.get("/", (req, res) => {
      res.send("Fable Ebook API Running");
    });

  } catch (error) {
    console.error(error);
  }
}

run();

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});