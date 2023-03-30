const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const cors = require("cors");

// require database connection
const dbConnect = require("./db/dbConnect");
const User = require("./db/userModel");
const Post = require("./db/postModel");
const Info = require("./db/infoModel");
const auth = require("./auth");

// execute database connection
dbConnect();

// Curb Cores Error by adding a header here
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

// body parser configuration
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// app.post("/register", async (request, response) => {
//   try {
//     const hashedPassword = await bcrypt.hash(request.body.password, 10);

//     const user = new User({
//       name: request.body.name,
//       password: hashedPassword,
//     });

//     const savedUser = await user.save();

//     response.status(201).send({
//       message: "User Created Successfully",
//       user: savedUser,
//     });
//   } catch (error) {
//     console.log(error);
//     response.status(500).send({
//       message: "Error creating user",
//       error,
//     });
//   }
// });

// login endpoint
app.post("/login", (request, response) => {
  // check if email exists
  User.findOne({ name: request.body.name })

    // if email exists
    .then((user) => {
      // compare the password entered and the hashed password found
      bcrypt
        .compare(request.body.password, user.password)

        // if the passwords match
        .then((passwordCheck) => {
          // check if password matches
          if (!passwordCheck) {
            return response.status(400).send({
              message: "Passwords does not match",
              error,
            });
          }

          //   create JWT token
          const token = jwt.sign(
            {
              userId: user._id,
              userName: user.name,
            },
            process.env.TOKEN_SECRET,
            { expiresIn: "24h" }
          );

          //   return success response
          response.status(200).send({
            message: "Login Successful",
            name: user.name,
            token,
          });
        })
        // catch error if password do not match
        .catch((error) => {
          response.status(400).send({
            message: "Passwords does not match",
            error,
          });
        });
    })
    // catch error if email does not exist
    .catch((e) => {
      response.status(404).send({
        message: "Email not found",
        e,
      });
    });
});

app.post("/posts", auth, async (req, res) => {
  try {
    const { title, subtitle, mediaType, mediaUrl } = req.body;
    const newPost = new Post({ title, subtitle, mediaType, mediaUrl });

    const savedPost = await newPost.save();

    res.status(201).json(savedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put("/posts/:id", auth, async (req, res) => {
  try {
    const { title, subtitle, mediaType, mediaUrl } = req.body;

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { title, subtitle, mediaType, mediaUrl },
      { new: true }
    );

    res.json(updatedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.post("/logout", (req, res) => {
  // clear the JWT token from the client-side
  res.clearCookie("TOKEN");
  // update the user's logged-out status
  res.json({ success: true });
});

app.get("/posts", async (req, res) => {
  try {
    const skip = parseInt(req.query.skip) || 0;
    const posts = await Post.find().sort({ _id: -1 }).skip(skip).limit(7);
    res.send(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/posts-all", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ _id: -1 });
    res.send(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/posts/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    res.send(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/getInfo", async (req, res) => {
  try {
    const info = await Info.findOne({});
    res.json(info);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.patch("/editInfo", auth, async (req, res) => {
  try {
    const updatedInfo = await Info.findOneAndUpdate(
      {}, // update the first document found
      req.body, // use the request body to update the fields
      { new: true, upsert: true } // set `new` option to true to return the updated document, and `upsert` to true to create a new document if none exists
    );
    res.json(updatedInfo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete("/posts/:id", auth, async (req, res) => {
  const postId = req.params.id;

  try {
    // Check if the post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Delete the post
    await post.remove();
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.use(express.static(path.join(__dirname, "build")));

// Serve the index.html file for all non-static routes

app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

module.exports = app;
