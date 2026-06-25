const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const logger = (req,res , next) =>
{
  console.log('logger logged', req.params);
  next();
}



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
    const sessionsCollection = database.collection("session");


    //verfify token middleware
    const verifyToken = async (req , res, next) =>
{
  const authHeader = req.headers.authorization;
  if(!authHeader)
  {
    return res.status(401).send({message: 'Unauthorized access'});
  }
  const token = authHeader.split(' ')[1];
  if(!token)
  {
    return res.status(403).send({message: 'Forbidden access'});
  }
  const query = { token: token };
  const session = await sessionsCollection.findOne(query);
  const userId = session?.userId;
  console.log('userId', userId);
  console.log('session', session);

  const userQuery = { _id: new ObjectId(userId) };
  const user = await usersCollection.findOne(userQuery);
  req.user = user;

  next();
}
const verifyReader = async(req, res, next) => {

  if(req.user?.userRole !== 'reader')
  {
    return res.status(403).send({message: 'Forbidden access'});
  }
  next();
}
const verifyWriter = async(req, res, next) => {

  if(req.user?.userRole !== 'writer') 
{
    return res.status(403).send({message: 'Forbidden access'});
  }   
  next();
  }

  const verifyAdmin = async(req, res, next) => {

    if(req.user?.userRole !== 'admin')    
{
      return res.status(403).send({message: 'Forbidden access'});
    } 
  }


    // ================= BOOKS =================
    app.get("/api/books", async (req, res) => {
      const query = {};
      if (req.query.email) {
        query.authorEmail = req.query.email;
      }

      const books = await booksCollection.find(query).toArray();
      res.send(books);
    });
    // Latest 6 published ebooks for Featured section
app.get("/api/books/featured", async (req, res) => {
  const books = await booksCollection
    .find({ status: "published" })
    .sort({ createdAt: -1 })
    .limit(6)
    .toArray();

  res.send(books);
});

// Top 3 writers by total sales count
app.get("/api/writers/top", async (req, res) => {
  const topWriters = await purchasesCollection
    .aggregate([
      {
        $group: {
          _id: "$writerEmail",
          name: { $first: "$writerName" },
          totalSales: { $sum: 1 },
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: 3 },
    ])
    .toArray();

  res.send(topWriters);
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

    app.patch("/api/books/:id", verifyToken, verifyWriter,async (req, res) => {
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

    app.patch("/api/books/:id/status", verifyToken, verifyAdmin, async (req, res) => {
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

    app.post("/api/books",verifyToken, verifyWriter, async (req, res) => {
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

    app.get("/api/purchases", verifyToken, async (req, res) => {
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
    app.post("/api/bookmarks", verifyToken, async (req, res) => {
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

    app.delete("/api/bookmarks",verifyToken, async (req, res) => {
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

    app.get("/api/bookmarks",logger, verifyToken, async (req, res) => {
      const result = await bookmarksCollection
        .find({ userEmail: req.query.email })
        .toArray();

      console

      res.send(result);
    });
    // ================= TRANSACTIONS =================
// Paste inside run(), alongside your other routes.

app.get("/api/transactions", verifyToken, verifyAdmin, async (req, res) => {
  const transactions = await purchasesCollection.aggregate([
    {
      $project: {
        type: { $literal: "purchase" },
        userEmail: "$buyerEmail",
        writerEmail: "$writerEmail",
        bookTitle: "$bookTitle",
        amount: "$price",
        date: "$purchasedAt",
      },
    },
    {
      $unionWith: {
        coll: "books",
        pipeline: [
          {
            $project: {
              type: { $literal: "publishing fee" },
              userEmail: "$authorEmail",
              writerEmail: "$authorEmail",
              bookTitle: "$title",
              amount: { $ifNull: ["$publishingFee", 0] },
              date: "$createdAt",
            },
          },
        ],
      },
    },
    { $sort: { date: -1 } },
  ]).toArray();

  res.send(transactions);
});

// ================= ANALYTICS =================
// Add inside run() in server.js

app.get("/api/admin/analytics", async (req, res) => {
  // --- Stat cards ---
  const totalUsers   = await usersCollection.estimatedDocumentCount();
  const totalWriters = await usersCollection.countDocuments({ role: "writer" });
  const totalSold    = await purchasesCollection.estimatedDocumentCount();

  const revenueAgg = await purchasesCollection.aggregate([
    { $group: { _id: null, total: { $sum: { $toDouble: "$price" } } } },
  ]).toArray();
  const totalRevenue = revenueAgg[0]?.total ?? 0;

  // --- Monthly sales (last 12 months) ---
  const monthlySales = await purchasesCollection.aggregate([
    {
      $group: {
        _id: {
          year:  { $year:  "$purchasedAt" },
          month: { $month: "$purchasedAt" },
        },
        sales:   { $sum: 1 },
        revenue: { $sum: { $toDouble: "$price" } },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    { $limit: 12 },
    {
      $project: {
        _id: 0,
        month: {
          $dateToString: {
            format: "%b %Y",
            date: {
              $dateFromParts: { year: "$_id.year", month: "$_id.month", day: 1 },
            },
          },
        },
        sales:   1,
        revenue: 1,
      },
    },
  ]).toArray();

  // --- Ebooks by genre ---
  const byGenre = await booksCollection.aggregate([
    { $group: { _id: "$genre", count: { $sum: 1 } } },
    { $project: { _id: 0, genre: "$_id", count: 1 } },
    { $sort: { count: -1 } },
  ]).toArray();

  res.send({ totalUsers, totalWriters, totalSold, totalRevenue, monthlySales, byGenre });
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