const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const ObjectId = require("mongodb").ObjectId;

const PORT = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri =
  process.env.NODE_ENV == "development"
    ? `${process.env.MONGO_URL}`
    : `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@earth1.ewh2i.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    const database = client.db("blog-app");
    const usersCollection = database.collection("usersCollection");
    const blogsCollection = database.collection("blogsCollection");
    const commentsCollection = database.collection("comments");

    // Get the blogs
    app.get("/blogs", async (req, res) => {
      const query = {};
      const cursor = blogsCollection.find(query);
      const result = await cursor.toArray();
      res.json(result);
    });
    // get the blogs paginated
    app.get("/allBlogs", async (req, res) => {
      const query = {};
      const page = parseInt(req.query.page);
      const limit = parseInt(req.query.limit);

      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;

      const cursor = blogsCollection.find(query);
      const blogs = await cursor.toArray();

      const result = {};

      const totalBlogs = blogs.length;
      let totalPage = Math.ceil(totalBlogs / limit);

      result.totalBlogs = {
        totalBlogs: totalBlogs,
        totalPage: totalPage,
      };

      if (startIndex > 0) {
        result.previous = {
          page: page - 1,
          limit: limit,
        };
      }
      if (endIndex < totalBlogs) {
        result.next = {
          page: page + 1,
          limit: limit,
        };
      }

      result.result = blogs.slice(startIndex, endIndex);
      res.json(result);
    });
    //get single blog
    app.get("/blog/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await blogsCollection.findOne(query);
      res.json(result);
    });
    // add the blog to the database
    app.post("/newBlog", async (req, res) => {
      const newPost = req.body;
      const result = await blogsCollection.insertOne(newPost);
      res.json(result);
    });
    // add comment to the specific blog
    app.post("/newComment", async (req, res) => {
      const newComment = req.body;
      const result = await commentsCollection.insertOne(newComment);
      res.json(result);
    });

    //get the comments
    app.get("/comments", async (req, res) => {
      const query = {};
      const cursor = commentsCollection.find(query);
      const result = await cursor.toArray();
      res.json(result);
    });

    // get the selected comments for single blog
    app.get("/comment/:id", async (req, res) => {
      const blogId = req.params.id;
      console.log(blogId);
      const query = { blogId: blogId };
      const result = {};
      const cursor = commentsCollection.find(query);
      result.result = await cursor.toArray();
      res.json(result);
    });
  } finally {
    //await client.close()
  }
}

run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("getting info from index.js of blog server");
});

app.listen(PORT, () => {
  console.log(`listening at ${PORT}`);
});
