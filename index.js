const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;


//Middleware
app.use(cors({
    origin: [
        'http://localhost:5173'
    ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());


const logger = (req, res, next) => {
    console.log('logging info', req.method, req.url);
    next();
}

const verifyingToken = (req, res, next) => {
    const token = req?.cookies?.token;
    console.log('Middleware token', token);
    if (!token) {
        return res.status(401).send({ message: 'unauthorize access' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decode) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorize access' })
        }
        req.user = decode;
        next();
    })

}


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
        const addedFoodsCollection = client.db('allFoodsDB').collection('addedFoods');
        const myAddedCollection = client.db('allFoodsDB').collection('myAddedFoods');


        //auth related api
        app.post('/jwt', logger, async (req, res) => {
            const user = req.body;
            console.log('user token', user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' });

            // res.send({ token });
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            })
                .send({ success: true });
        })


        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('logging out', user)
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })



        //user related api
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

        //all foods related api

        app.get('/allFoods', async (req, res) => {
            const cursor = allFoodsCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })


        app.get('/allFoods/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };

            const options = {
                projection: { food_name: 1, image_url: 1, category: 1, quantity: 1, price: 1, food_origin: 1, short_description: 1 },
            };
            const result = await allFoodsCollection.findOne(query, options);
            res.send(result);
        })


        // orders related api
        // purchased foods added on addedFoodsCollection
        app.post('/addedFoods', async (req, res) => {
            const addedFoods = req.body;
            console.log(addedFoods);


            const result = await addedFoodsCollection.insertOne(addedFoods);
            res.send(result);
        })

        //delete operation from ordered food
        app.delete('/addedFoods/:id', async (req, res) => {
            const id = req.params.id;

            const query = { _id: new ObjectId(id) };
            const result = await addedFoodsCollection.deleteOne(query);
            res.send(result);
        })


        app.get('/addedFoods', logger, verifyingToken, async (req, res) => {
            console.log(req.query.email);
            console.log('token owner :', req.user);
            if (req.user.email !== req.query.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            let query = {};
            if (req.query.email) {
                query = { email: req.query.email }
            }
            const result = await addedFoodsCollection.find(query).toArray();
            res.send(result);
        })


        // show uploaded foods from main database by logged-in user
        app.get('/uploadedFoods', async (req, res) => {
            console.log(req.query.email);
            let query = {};
            if (req.query.email) {
                query = { email: req.query.email }
            }
            const result = await allFoodsCollection.find(query).toArray();
            res.send(result);
        })

        //get for update uploaded foods by logged-in user
        app.get('/uploadedFoods/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await allFoodsCollection.findOne(query);
            res.send(result);

            // update uploaded food
            app.put('/uploadedFoods/:id', async (req, res) => {
                const id = req.params.id;
                const filter = { _id: new ObjectId(id) };
                const options = { upsert: true };
                const updateFood = req.body;
                const food = {
                    $set: {
                        name: updateFood.name,
                        email: updateFood.email,
                        food_name: updateFood.food_name,
                        image_url: updateFood.image_url,
                        category: updateFood.category,
                        quantity: updateFood.quantity,
                        price: updateFood.price,
                        food_origin: updateFood.food_origin,
                        short_description: updateFood.short_description
                    }
                }
                const result = await allFoodsCollection.updateOne(filter, food, options);
                res.send(result);
            })


        })




        //myAdded foods to main database/allFoodsCollection
        app.post('/myFoods', async (req, res) => {
            const myFoods = req.body;
            console.log(myFoods);
            const result = await allFoodsCollection.insertOne(myFoods);
            res.send(result);
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