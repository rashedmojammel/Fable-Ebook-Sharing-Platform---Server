// const express = require("express");
// const cors = require("cors");
// require("dotenv").config();

// const app = express();
// const port = process.env.PORT || 5000;

// app.use(cors());
// app.use(express.json());

// const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// const logger = (req,res , next) =>
// {
//   // console.log('logger logged', req.params);
//   next();
// }



// const client = new MongoClient(process.env.MONGODB_URI, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   },
// });



// async function run() {
//   try {
//     await client.connect();
//     console.log("✅ MongoDB Connected");

//     const database = client.db("Fable-Ebook-Sharing-Platform");

//     const booksCollection = database.collection("books");
//     const usersCollection = database.collection("user");
//     const purchasesCollection = database.collection("purchases");
//     const bookmarksCollection = database.collection("bookmarks");
//     const sessionsCollection = database.collection("session");


//     //verfify token middleware
//     const verifyToken = async (req , res, next) =>
// {
//   const authHeader = req.headers.authorization;
//   if(!authHeader)
//   {
//     return res.status(401).send({message: 'Unauthorized access'});
//   }
//   const token = authHeader.split(' ')[1];
//   if(!token)
//   {
//     return res.status(403).send({message: 'Forbidden access'});
//   }
//   const query = { token: token };
//   const session = await sessionsCollection.findOne(query);
//   const userId = session?.userId;
//   console.log('userId', userId);
//   console.log('session', session);

//   const userQuery = { _id: new ObjectId(userId) };
//   const user = await usersCollection.findOne(userQuery);
//   req.user = user;

//   next();
// }
// const verifyReader = async(req, res, next) => {

//   if(req.user?.userRole !== 'reader')
//   {
//     return res.status(403).send({message: 'Forbidden access'});
//   }
//   next();
// }
// const verifyWriter = async(req, res, next) => {

//   if(req.user?.userRole !== 'writer') 
// {
//     return res.status(403).send({message: 'Forbidden access'});
//   }   
//   next();
//   }

//   const verifyAdmin = async(req, res, next) => {

//     if(req.user?.userRole !== 'admin')    
// {
//       return res.status(403).send({message: 'Forbidden access'});
//     } 
//   }


//     // ================= BOOKS =================
//     app.get("/api/books", async (req, res) => {
//       const query = {};
//       if (req.query.email) {
//         query.authorEmail = req.query.email;
//       }

//       const books = await booksCollection.find(query).toArray();
//       res.send(books);
//     });
//     // Latest 6 published ebooks for Featured section
// app.get("/api/books/featured", async (req, res) => {
//   const books = await booksCollection
//     .find({ status: "published" })
//     .sort({ createdAt: -1 })
//     .limit(6)
//     .toArray();

//   res.send(books);
// });

// // Top 3 writers by total sales count
// app.get("/api/writers/top", async (req, res) => {
//   const topWriters = await purchasesCollection
//     .aggregate([
//       {
//         $group: {
//           _id: "$writerEmail",
//           name: { $first: "$writerName" },
//           totalSales: { $sum: 1 },
//         },
//       },
//       { $sort: { totalSales: -1 } },
//       { $limit: 3 },
//     ])
//     .toArray();

//   res.send(topWriters);
// });


//     app.get("/api/books/:id", async (req, res) => {

//       const id = req.params.id;

//       if (!ObjectId.isValid(id)) {
//         return res.status(400).send({ message: "Invalid book id" });
//       }

//       const result = await booksCollection.findOne({ _id: new ObjectId(id) });

//       if (!result) {
//         return res.status(404).send({ message: "Book not found" });
//       }

//       res.send(result);
//     });
    

//     app.patch("/api/books/:id", verifyToken, verifyWriter,async (req, res) => {
//       const id = req.params.id;
//       if(!ObjectId.isValid(id)) {
//         return res.status(400).send({ message: "Invalid book id" });
//       } 
//        const updateDoc = {
//     $set: {
//       title: req.body.title,
//       description: req.body.description,
//       genre: req.body.genre,
//       price: req.body.price,
//       coverImage: req.body.coverImage,
//     },
//   };
//       const result = await booksCollection.updateOne(
//         { _id: new ObjectId(id) },
//         updateDoc
//       );
//       res.send(result);

//     });
//     app.delete("/api/books/:id", async (req, res) => {
//       const id = req.params.id;
//       if(!ObjectId.isValid(id)) {
//         return res.status(400).send({ message: "Invalid book id" });
//       }

//       const result = await booksCollection.deleteOne({ _id: new ObjectId(id) });
//       res.send(result);
//     });

//     app.patch("/api/books/:id/status", verifyToken, verifyAdmin, async (req, res) => {
//       const id = req.params.id;
//       if(!ObjectId.isValid(id)) {
//         return res.status(400).send({ message: "Invalid book id" });
//       }

//       const result = await booksCollection.updateOne(
//         { _id: new ObjectId(id) },
//         { $set: { status: req.body.status } }
//       );
//       res.send(result);
//     });

//     app.post("/api/books",verifyToken, verifyWriter, async (req, res) => {
//       const result = await booksCollection.insertOne(req.body);
//       res.status(201).send(result);
//     });

//     // ================= PURCHASES =================
//     app.post("/api/purchases", async (req, res) => {
//       const { bookId, buyerEmail, buyerName, stripeSessionId } = req.body;

//       const existing = await purchasesCollection.findOne({ bookId, buyerEmail });
//       if (existing) return res.send(existing);

//       if (!ObjectId.isValid(bookId)) {
//         return res.status(400).send({ message: "Invalid book id" });
//       }

//       const book = await booksCollection.findOne({ _id: new ObjectId(bookId) });
//       if (!book) return res.status(404).send({ message: "Book not found" });

//       const purchase = {
//         bookId,
//         bookTitle: book.title,
//         bookCoverImage: book.coverImage,
//         price: book.price,
//         buyerEmail,
//         buyerName: buyerName || buyerEmail,
//         writerEmail: book.authorEmail,
//         writerName: book.authorName,
//         stripeSessionId: stripeSessionId || null,
//         purchasedAt: new Date(),
//       };

//       const result = await purchasesCollection.insertOne(purchase);

//       await booksCollection.updateOne(
//         { _id: new ObjectId(bookId) },
//         { $inc: { sales: 1 } }
//       );

//       res.status(201).send({ ...purchase, _id: result.insertedId });
//     });

//     app.get("/api/purchases/check", async (req, res) => {
//       const purchase = await purchasesCollection.findOne({
//         bookId: req.query.bookId,
//         buyerEmail: req.query.email,
//       });

//       res.send({ purchased: !!purchase });
//     });

//     app.get("/api/purchases", verifyToken, async (req, res) => {
//       const result = await purchasesCollection
//         .find({ buyerEmail: req.query.email })
//         .toArray();

//       res.send(result);
//     });

//     app.get("/api/sales", async (req, res) => {
//       const result = await purchasesCollection
//         .find({ writerEmail: req.query.email })
//         .toArray();

//       res.send(result);
//     });
    
//     // ================= BOOKMARKS =================
//     app.post("/api/bookmarks", verifyToken, async (req, res) => {
//       const bookmark = req.body;

//       const existing = await bookmarksCollection.findOne({
//         bookId: bookmark.bookId,
//         userEmail: bookmark.userEmail,
//       });

//       if (existing) return res.send(existing);

//       bookmark.bookmarkedAt = new Date();
//       const result = await bookmarksCollection.insertOne(bookmark);

//       res.status(201).send(result);
//     });

//     app.delete("/api/bookmarks",verifyToken, async (req, res) => {
//       const result = await bookmarksCollection.deleteOne({
//         bookId: req.body.bookId,
//         userEmail: req.body.userEmail,
//       });

//       res.send(result);
//     });

//     app.get("/api/bookmarks/check", async (req, res) => {
//       const bookmark = await bookmarksCollection.findOne({
//         bookId: req.query.bookId,
//         userEmail: req.query.email,
//       });

//       res.send({ bookmarked: !!bookmark });
//     });

//     app.get("/api/bookmarks",logger, verifyToken, async (req, res) => {
//       const result = await bookmarksCollection
//         .find({ userEmail: req.query.email })
//         .toArray();

//       console

//       res.send(result);
//     });
//     // ================= TRANSACTIONS =================


// app.get("/api/transactions", verifyToken, verifyAdmin, async (req, res) => {
//   const transactions = await purchasesCollection.aggregate([
//     {
//       $project: {
//         type: { $literal: "purchase" },
//         userEmail: "$buyerEmail",
//         writerEmail: "$writerEmail",
//         bookTitle: "$bookTitle",
//         amount: "$price",
//         date: "$purchasedAt",
//       },
//     },
//     {
//       $unionWith: {
//         coll: "books",
//         pipeline: [
//           {
//             $project: {
//               type: { $literal: "publishing fee" },
//               userEmail: "$authorEmail",
//               writerEmail: "$authorEmail",
//               bookTitle: "$title",
//               amount: { $ifNull: ["$publishingFee", 0] },
//               date: "$createdAt",
//             },
//           },
//         ],
//       },
//     },
//     { $sort: { date: -1 } },
//   ]).toArray();

//   res.send(transactions);
// });

// // ================= ANALYTICS =================


// app.get("/api/admin/analytics", async (req, res) => {
//   // --- Stat cards ---
//   const totalUsers   = await usersCollection.estimatedDocumentCount();
//   const totalWriters = await usersCollection.countDocuments({ role: "writer" });
//   const totalSold    = await purchasesCollection.estimatedDocumentCount();

//   const revenueAgg = await purchasesCollection.aggregate([
//     { $group: { _id: null, total: { $sum: { $toDouble: "$price" } } } },
//   ]).toArray();
//   const totalRevenue = revenueAgg[0]?.total ?? 0;

//   // --- Monthly sales (last 12 months) ---
//   const monthlySales = await purchasesCollection.aggregate([
//     {
//       $group: {
//         _id: {
//           year:  { $year:  "$purchasedAt" },
//           month: { $month: "$purchasedAt" },
//         },
//         sales:   { $sum: 1 },
//         revenue: { $sum: { $toDouble: "$price" } },
//       },
//     },
//     { $sort: { "_id.year": 1, "_id.month": 1 } },
//     { $limit: 12 },
//     {
//       $project: {
//         _id: 0,
//         month: {
//           $dateToString: {
//             format: "%b %Y",
//             date: {
//               $dateFromParts: { year: "$_id.year", month: "$_id.month", day: 1 },
//             },
//           },
//         },
//         sales:   1,
//         revenue: 1,
//       },
//     },
//   ]).toArray();

//   // --- Ebooks by genre ---
//   const byGenre = await booksCollection.aggregate([
//     { $group: { _id: "$genre", count: { $sum: 1 } } },
//     { $project: { _id: 0, genre: "$_id", count: 1 } },
//     { $sort: { count: -1 } },
//   ]).toArray();

//   res.send({ totalUsers, totalWriters, totalSold, totalRevenue, monthlySales, byGenre });
// });


//     app.get("/", (req, res) => {
//       res.send("Fable Ebook API Running");
//     });

    
//     app.listen(port, () => {
//       console.log(`🚀 Server running on port ${port}`);
//     });
//   } catch (error) {
//     console.error(error);
//   }
// }

// run();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
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
    const sessionsCollection = database.collection("session");

    // ================= NODEMAILER =================
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const sendPurchaseEmail = async (purchase) => {
      const mailOptions = {
        from: `"Fable 📚" <${process.env.EMAIL_USER}>`,
        to: purchase.buyerEmail,
        subject: `Purchase Confirmed: ${purchase.bookTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
            <body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',sans-serif;">
              <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

                <!-- Header -->
                <div style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:36px 40px;text-align:center;">
                  <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;">📚 Fable</h1>
                  <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Read • Share • Discover</p>
                </div>

                <!-- Body -->
                <div style="padding:40px;">
                  <h2 style="margin:0 0 8px;color:#18181b;font-size:22px;font-weight:700;">Payment Successful 🎉</h2>
                  <p style="margin:0 0 24px;color:#71717a;font-size:15px;line-height:1.6;">
                    Hi ${purchase.buyerName || "Reader"}, your purchase is confirmed and the full content is now unlocked.
                  </p>

                  <!-- Book Card -->
                  <div style="background:#f9f9fb;border:1px solid #e4e4e7;border-radius:12px;padding:20px;margin-bottom:28px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#a855f7;text-transform:uppercase;letter-spacing:0.08em;">Purchased Ebook</p>
                    <h3 style="margin:0 0 8px;color:#18181b;font-size:18px;font-weight:700;">${purchase.bookTitle}</h3>
                    <p style="margin:0 0 4px;color:#71717a;font-size:14px;">by ${purchase.writerName || "Unknown Author"}</p>
                    <p style="margin:12px 0 0;font-size:22px;font-weight:800;color:#16a34a;">$${purchase.price}</p>
                  </div>

                  <!-- Details -->
                  <table style="width:100%;border-collapse:collapse;font-size:14px;color:#52525b;margin-bottom:28px;">
                    <tr>
                      <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;">Order Date</td>
                      <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;text-align:right;color:#18181b;font-weight:600;">
                        ${new Date(purchase.purchasedAt).toLocaleDateString("en-US", {
                          month: "long", day: "numeric", year: "numeric"
                        })}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;">Email</td>
                      <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;text-align:right;color:#18181b;font-weight:600;">
                        ${purchase.buyerEmail}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:10px 0;">Status</td>
                      <td style="padding:10px 0;text-align:right;">
                        <span style="background:#dcfce7;color:#16a34a;font-weight:600;font-size:12px;padding:4px 10px;border-radius:999px;">Completed</span>
                      </td>
                    </tr>
                  </table>

                  <!-- CTA -->
                  <a href="${process.env.CLIENT_URL}/books/${purchase.bookId}"
                    style="display:block;text-align:center;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-weight:700;font-size:15px;padding:14px 24px;border-radius:12px;text-decoration:none;">
                    Read Now →
                  </a>
                </div>

                <!-- Footer -->
                <div style="padding:24px 40px;border-top:1px solid #f4f4f5;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#a1a1aa;">
                    You received this because you made a purchase on Fable.
                  </p>
                  <p style="margin:6px 0 0;font-size:12px;color:#a1a1aa;">
                    Need help? <a href="mailto:support@fable.com" style="color:#7c3aed;">support@fable.com</a>
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Purchase email sent to ${purchase.buyerEmail}`);
      } catch (error) {
        console.error("❌ Email send failed:", error.message);
        // Don't throw — email failure should never break the purchase
      }
    };

    // ================= MIDDLEWARE =================
    const verifyToken = async (req, res, next) => {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).send({ message: "Unauthorized access" });
      }

      const token = authHeader.split(" ")[1];

      if (!token) {
        return res.status(401).send({ message: "Unauthorized access" });
      }

      const session = await sessionsCollection.findOne({ token });

      if (!session) {
        return res.status(401).send({ message: "Invalid or expired session" });
      }

      if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
        return res.status(401).send({ message: "Session expired" });
      }

      // ✅ better-auth stores userId as string — use id field not _id
      const user = await usersCollection.findOne({ id: session.userId });

      if (!user) {
        return res.status(401).send({ message: "User not found" });
      }

      req.user = user;
      next();
    };

    const verifyReader = async (req, res, next) => {
      if (req.user?.userRole !== "reader") {
        return res.status(403).send({ message: "Forbidden access" });
      }
      next();
    };

    const verifyWriter = async (req, res, next) => {
      if (req.user?.userRole !== "writer") {
        return res.status(403).send({ message: "Forbidden access" });
      }
      next();
    };

    const verifyAdmin = async (req, res, next) => {
      if (req.user?.userRole !== "admin") {
        return res.status(403).send({ message: "Forbidden access" });
      }
      next(); // ✅ was missing
    };

    // ================= BOOKS =================
    app.get("/api/books", async (req, res) => {
      const { email, genre, search, minPrice, maxPrice, sort } = req.query;
      const query = {};

      if (email) query.authorEmail = email;
      if (!email) query.status = "published";
      if (genre) query.genre = genre;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { authorName: { $regex: search, $options: "i" } },
        ];
      }
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
      }

      let sortOption = { createdAt: -1 };
      if (sort === "price_asc") sortOption = { price: 1 };
      if (sort === "price_desc") sortOption = { price: -1 };

      const books = await booksCollection.find(query).sort(sortOption).toArray();
      res.send(books);
    });

    app.get("/api/books/featured", async (req, res) => {
      const books = await booksCollection
        .find({ status: "published" })
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray();
      res.send(books);
    });

    app.get("/api/writers/top", async (req, res) => {
      const topWriters = await purchasesCollection
        .aggregate([
          { $group: { _id: "$writerEmail", name: { $first: "$writerName" }, totalSales: { $sum: 1 } } },
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

    app.post("/api/books", verifyToken, verifyWriter, async (req, res) => {
      const result = await booksCollection.insertOne(req.body);
      res.status(201).send(result);
    });

    app.patch("/api/books/:id", verifyToken, verifyWriter, async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid book id" });
      }
      const result = await booksCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { title: req.body.title, description: req.body.description, genre: req.body.genre, price: req.body.price, coverImage: req.body.coverImage } }
      );
      res.send(result);
    });

    app.patch("/api/books/:id/status", verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid book id" });
      }
      const result = await booksCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: req.body.status } }
      );
      res.send(result);
    });

    app.delete("/api/books/:id", verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid book id" });
      }
      const result = await booksCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
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

      // ✅ Send confirmation email
      await sendPurchaseEmail(purchase);

      res.status(201).send({ ...purchase, _id: result.insertedId });
    });

    app.get("/api/purchases/check", async (req, res) => {
      const purchase = await purchasesCollection.findOne({
        bookId: req.query.bookId,
        buyerEmail: req.query.email,
      });
      res.send({ purchased: !!purchase });
    });

    app.get("/api/purchases", verifyToken, verifyReader, async (req, res) => {
      const result = await purchasesCollection
        .find({ buyerEmail: req.query.email })
        .toArray();
      res.send(result);
    });

    app.get("/api/sales", verifyToken, verifyWriter, async (req, res) => {
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

    app.delete("/api/bookmarks", verifyToken, async (req, res) => {
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

    app.get("/api/bookmarks", verifyToken, async (req, res) => {
      const result = await bookmarksCollection
        .find({ userEmail: req.query.email })
        .toArray();
      res.send(result);
    });

    // ================= TRANSACTIONS =================
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
    app.get("/api/admin/analytics", verifyToken, verifyAdmin, async (req, res) => {
      const totalUsers = await usersCollection.estimatedDocumentCount();
      const totalWriters = await usersCollection.countDocuments({ userRole: "writer" });
      const totalSold = await purchasesCollection.estimatedDocumentCount();

      const revenueAgg = await purchasesCollection.aggregate([
        { $group: { _id: null, total: { $sum: { $toDouble: "$price" } } } },
      ]).toArray();
      const totalRevenue = revenueAgg[0]?.total ?? 0;

      const monthlySales = await purchasesCollection.aggregate([
        {
          $group: {
            _id: { year: { $year: "$purchasedAt" }, month: { $month: "$purchasedAt" } },
            sales: { $sum: 1 },
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
                date: { $dateFromParts: { year: "$_id.year", month: "$_id.month", day: 1 } },
              },
            },
            sales: 1,
            revenue: 1,
          },
        },
      ]).toArray();

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