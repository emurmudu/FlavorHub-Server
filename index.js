const express = require('express')
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;


//Middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.viviyoh.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const userCollection = client.db('userDB').collection('user');
        const allFoodsCollection = client.db('allFoodsDB').collection('allFoods');

        // app.post('/register', async (req, res) => {
        //     try {
        //         const { email, password, name, photoURL } = req.body;
        //         const user = {
        //             email,
        //             password,
        //             name,
        //             photoURL,
        //         };

        //         const result = await userCollection.insertOne(user);

        //         res.status(201).json({ message: 'User registered successfully', userId: result.insertedId });
        //     } catch (error) {
        //         console.error("Error registering user:", error);
        //         res.status(500).json({ error: 'Internal Server Error' });
        //     }
        // });


        // app.post('/register', async (req, res) => {
        //     const requestBody = req.body;
        //     console.log(requestBody);
        //     const { email, password, name, photoURL } = requestBody;
        //     const user = {
        //         email,
        //         password,
        //         name,
        //         photoURL,
        //     };
        //     const result = await userCollection.insertOne(user);
        //     res.send(result);
        // });

        //create user on database
        app.post('/user', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await userCollection.insertOne(user);
            res.send(result);
        })

        //read user
        app.get('/user', async (req, res) => {
            const cursor = userCollection.find();
            const users = await cursor.toArray();
            res.send(users);
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('assignment-11-server is running')
})

app.listen(port, () => {
    console.log(`assignment-11-server is running on port : ${port}`)
})