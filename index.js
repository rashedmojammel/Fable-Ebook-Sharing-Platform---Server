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
    const usersCollection = database.collection("user");
    const purchasesCollection = database.collection("purchases");
    const bookmarksCollection = database.collection("bookmarks");

    // ================= BOOKS =================
    app.get("/api/books", async (req, res) => {
      const query = {};
      if (req.query.email) {
        query.authorEmail = req.query.email;
      }

      const books = await booksCollection.find(query).toArray();
      res.send(books);
    });

    app.get("/api/books/:id", async (req, res) => {
      const id = req.params.id;

      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid book id" });
      }

      const result = await booksCollection.findOne({ _id: new ObjectId(id) });

      if (!result) {
        return res.status(404).send({ message: "Book not found" });
      }

      res.send(result);
    });

    app.patch("/api/books/:id", async (req, res) => {
      const id = req.params.id;
      if(!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid book id" });
      } 
       const updateDoc = {
    $set: {
      title: req.body.title,
      description: req.body.description,
      genre: req.body.genre,
      price: req.body.price,
      coverImage: req.body.coverImage,
    },
  };
      const result = await booksCollection.updateOne(
        { _id: new ObjectId(id) },
        updateDoc
      );
      res.send(result);

    });
    app.delete("/api/books/:id", async (req, res) => {
      const id = req.params.id;
      if(!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid book id" });
      }

      const result = await booksCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.patch("/api/books/:id/status", async (req, res) => {
      const id = req.params.id;
      if(!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid book id" });
      }

      const result = await booksCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: req.body.status } }
      );
      res.send(result);
    });

    app.post("/api/books", async (req, res) => {
      const result = await booksCollection.insertOne(req.body);
      res.status(201).send(result);
    });

    // ================= PURCHASES =================
    app.post("/api/purchases", async (req, res) => {
      const { bookId, buyerEmail, buyerName, stripeSessionId } = req.body;

      const existing = await purchasesCollection.findOne({ bookId, buyerEmail });
      if (existing) return res.send(existing);

      if (!ObjectId.isValid(bookId)) {
        return res.status(400).send({ message: "Invalid book id" });
      }

      const book = await booksCollection.findOne({ _id: new ObjectId(bookId) });
      if (!book) return res.status(404).send({ message: "Book not found" });

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
    });

    app.get("/api/purchases/check", async (req, res) => {
      const purchase = await purchasesCollection.findOne({
        bookId: req.query.bookId,
        buyerEmail: req.query.email,
      });

      res.send({ purchased: !!purchase });
    });

    app.get("/api/purchases", async (req, res) => {
      const result = await purchasesCollection
        .find({ buyerEmail: req.query.email })
        .toArray();

      res.send(result);
    });

    app.get("/api/sales", async (req, res) => {
      const result = await purchasesCollection
        .find({ writerEmail: req.query.email })
        .toArray();

      res.send(result);
    });

    // ================= BOOKMARKS =================
    app.post("/api/bookmarks", async (req, res) => {
      const bookmark = req.body;

      const existing = await bookmarksCollection.findOne({
        bookId: bookmark.bookId,
        userEmail: bookmark.userEmail,
      });

      if (existing) return res.send(existing);

      bookmark.bookmarkedAt = new Date();
      const result = await bookmarksCollection.insertOne(bookmark);

      res.status(201).send(result);
    });

    app.delete("/api/bookmarks", async (req, res) => {
      const result = await bookmarksCollection.deleteOne({
        bookId: req.body.bookId,
        userEmail: req.body.userEmail,
      });

      res.send(result);
    });

    app.get("/api/bookmarks/check", async (req, res) => {
      const bookmark = await bookmarksCollection.findOne({
        bookId: req.query.bookId,
        userEmail: req.query.email,
      });

      res.send({ bookmarked: !!bookmark });
    });

    app.get("/api/bookmarks", async (req, res) => {
      const result = await bookmarksCollection
        .find({ userEmail: req.query.email })
        .toArray();

      res.send(result);
    });

    app.get("/", (req, res) => {
      res.send("Fable Ebook API Running");
    });

    
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  } catch (error) {
    console.error(error);
  }
}

run();