require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const slotsRoute = require("./routes/slots");
const bookRoute = require("./routes/book");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/slots", slotsRoute);
app.use("/book-slot", bookRoute);

const PORT = process.env.PORT || 4000;
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("Mongo connected");
  app.listen(PORT, () => console.log("API on", PORT));
});
