const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const dotenv = require("dotenv");
// Load environment variables
dotenv.config();
const app = express();
const port = process.env.PORT || 5000;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const { MongoClient, ServerApiVersion } = require("mongodb");
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qlvqjvw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
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
    const fashionCollection = client.db("fashion").collection("fashion");

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });

    app.get("/fashion", async (req, res) => {
      const result = await fashionCollection.find().toArray();
      res.send(result);
    });

    app.post("/create-checkout-session", async (req, res) => {
      const { cartItems } = req.body;
      // console.log("carrt", cartItems);
      const extractingItems = await cartItems.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(item.price * 100),
          product_data: {
            name: item.name,
            description: item.description,
            images: [item.image],
          },
        },
      }));

      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: extractingItems,
          mode: "payment",
          success_url: `${process.env.DOMAIN_URL}?success=true`,
          cancel_url: `${process.env.DOMAIN_URL}?canceled=true`,
        });

        // Send the session URL to the frontend
        res.json({ url: session.url });
      } catch (error) {
        res.status(500).send("Error creating checkout session");
      }
    });

    app.get("/", (req, res) => {
      res.send("E-Commerce running...");
    });

    app.listen(port, () => {
      console.log(`E-Commerce running on port ${port}`);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
// end
