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
    const purchasesCollection = database.collection("purchases");

    
    app.get("/api/books", async (req, res) => {
      const query = {};
      console.log(req.query.email);
      if(req.query.email){ 

        query.authorEmail = req.query.email;
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

    // Create a purchase (idempotent — safe to call more than once for the same buyer+book)
app.post("/api/purchases", async (req, res) => {
  try {
    const { bookId, buyerEmail, buyerName, stripeSessionId } = req.body;

    if (!bookId || !buyerEmail) {
      return res.status(400).send({ message: "bookId and buyerEmail are required" });
    }

    // Already recorded? Return the existing purchase instead of duplicating
    const existing = await purchasesCollection.findOne({ bookId, buyerEmail });
    if (existing) {
      return res.status(200).send(existing);
    }

    const book = await booksCollection.findOne({ _id: new ObjectId(bookId) });
    if (!book) {
      return res.status(404).send({ message: "Book not found" });
    }

    const purchase = {
      bookId,
      bookTitle: book.title,
      bookCoverImage: book.coverImage,
      price: book.price,
      buyerEmail,
      buyerName: buyerName || buyerEmail,
      writerEmail: book.authorEmail,
      writerName: book.authorName,
      stripeSessionId: stripeSessionId || null,
      purchasedAt: new Date(),
    };

    const result = await purchasesCollection.insertOne(purchase);

    await booksCollection.updateOne(
      { _id: new ObjectId(bookId) },
      { $inc: { sales: 1 } }
    );

    res.status(201).send({ ...purchase, _id: result.insertedId });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});

app.post("/api/purchases", async (req, res) => {
  try {
    const purchase = req.body;

    const existing = await purchasesCollection.findOne({
      bookId: purchase.bookId,
      buyerEmail: purchase.buyerEmail,
    });

    if (existing) {
      return res.send(existing);
    }

    purchase.purchasedAt = new Date();
    const result = await purchasesCollection.insertOne(purchase);

    res.status(201).send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: error.message });
  }
});

app.get("/api/purchases/check", async (req, res) => {
  const query = {
    bookId: req.query.bookId,
    buyerEmail: req.query.email,
  };

  const purchase = await purchasesCollection.findOne(query);
  res.send({ purchased: !!purchase });
});

app.get("/api/purchases", async (req, res) => {
  const query = { buyerEmail: req.query.email };
  const result = await purchasesCollection.find(query).toArray();
  res.send(result);
});

app.get("/api/sales", async (req, res) => {
  const query = { writerEmail: req.query.email };
  const result = await purchasesCollection.find(query).toArray();
  res.send(result);
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