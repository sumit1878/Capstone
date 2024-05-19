const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require("jsonwebtoken");
const cors = require('cors');
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://chaudharysumit2003:sumit@cluster0.dcha5md.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


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

    const usersCollection = client.db('libraryManagement').collection('users');
    
    const booksCategoryCollection = client.db('libraryManagement').collection('booksCategory');

    const booksCollection = client.db('libraryManagement').collection('books');

    const borrowedBooksCollection = client.db('libraryManagement').collection('borrowedBook');

    const reviewsCollection = client.db('libraryManagement').collection('reviews');
    
    // jwt related api 

    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    app.post("/api/v1/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "4h",
      });
      res.send({ token });
    });
    // jwt related api 
    
    app.post("/createUser", async (req, res) => {
      const users = req.body;
      const query = { email: users.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exist", insertedId: null });
      }
      const result = await usersCollection.insertOne(users);
      res.send(result);
    });

    
    app.post('/createBooks', verifyToken, async(req, res) => {
        const addBooks = req.body;
        const result = await booksCollection.insertOne(addBooks);
        res.send(result);
      })
   
    
    app.get('/booksCategory', async(req, res) => {
        const cursor = booksCategoryCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    })
    

   
    app.get('/allBooks', async(req, res) => {
      const allBooks = booksCollection.find();
      const result = await allBooks.toArray();
      res.send(result);
    })
   

    app.get('/filterBooks', async(req, res) => {
      const filterBook = booksCollection.find({quantity : {$ne: 0}});
      const result = await filterBook.toArray();
      res.send(result);
    })


    
    app.put('/books/:id', verifyToken, async(req, res) => {
      const updateBook = req.body;
      const id = req.params.id;
      const filter = {_id : new ObjectId(id)};
      const options = { upsert: true };
      const updatedBook = {
        $set: {
          image : updateBook.image,
          name : updateBook.name,
          author : updateBook.author,
          category : updateBook.category,
          rating : updateBook.rating
        }
      }

      const result = await booksCollection.updateOne(filter, updatedBook, options);
      res.send(result);
    })
    

   
    app.get('/books/:category', async(req, res) => {
        const category = req.params.category;
        const cursor = booksCollection.find({category : category});
        const result = await cursor.toArray();
        res.send(result);
    })
   

 
   app.get('/singleBook/:id', async(req, res) => {
     const singleBooks = req.params.id;
     const query = {_id : new ObjectId(singleBooks)};
     const result = await booksCollection.findOne(query);
     res.send(result);
   })
  


//  .................//

   app.post('/createBorrowedBook', async(req, res) => {
     const borrowedBooks = req.body;

    //  console.log(borrowedBooks);

     const existingBorrowedBook = await borrowedBooksCollection.findOne({ email : borrowedBooks.email, bookId: borrowedBooks.bookId})

    //  console.log(existingBorrowedBook);

     if(existingBorrowedBook) {
      return res.send({
        message: "You have already borrowed a book",
        insertedId: null,
      });
     }

     

     const result = await borrowedBooksCollection.insertOne(borrowedBooks);
     res.send(result);

   })


   app.patch('/updateBookQuantity/:bookId', async(req, res) => {
    const bookId = req.params.bookId
    const updateQuantity = await booksCollection.findOne({_id : new ObjectId(bookId)})

    const newQuantity = updateQuantity.quantity - 1;

    const updateDoc = {
      $set : {
        quantity : newQuantity
      }
    }

    const result = await booksCollection.updateOne({_id : new ObjectId(bookId)}, updateDoc)

    const book = await booksCollection.findOne({_id : new ObjectId(bookId)})

    res.send({result, book});

   })

  //  .............///
  

 
  //  app.put('/borrowedBook/:id', async(req, res) => {
  //   const updateQuantity = req.body;
  //   const id = req.params.id;
  //     const filter = {_id : new ObjectId(id)};
  //     const options = { upsert: true };
  //     const updatedQuantity = {
  //       $set: {
  //         quantity : updateQuantity.quantity
  //       }
  //     }
  //     const result = await booksCollection.updateOne(filter, updatedQuantity, options)
  //     res.send(result);
  //  })


  

  
  // app.get('/borrowedBook', async(req, res) => {

  //   let query = {};
  //   if(req.query?.email){
  //     query = {email : req.query.email}
  //   }
  //   const result = await borrowedBooksCollection.find(query).toArray();
  //   res.send(result);

  // })

 
  app.get('/getBorrowedBook/:email', async(req, res) => {

     const email = req.params.email 
     const query = {email : email}

     const result = await borrowedBooksCollection.find(query).toArray();

     res.send(result);

  })
  

  
  app.delete('/removeBook/:id', async(req, res) => {
    const id = req.params.id;
    const query = {_id : new ObjectId(id)};
    const result = await borrowedBooksCollection.deleteOne(query);
    res.send(result);
  })

  app.patch('/increaseBookQuantity/:bookId', async(req, res) => {
    const bookId = req.params.bookId
    const increaseQuantity = await booksCollection.findOne({_id : new ObjectId(bookId)})

    const newIncrease = increaseQuantity.quantity + 1;

    const updateDoc = {
      $set : {
        quantity : newIncrease
      }
    }

    const result = await booksCollection.updateOne({_id : new ObjectId(bookId)}, updateDoc)

    res.send(result);

   })

   app.get('/reviews', async(req, res) => {
     const reviews = reviewsCollection.find();
     const result = await reviews.toArray();
     res.send(result);
   })




  // app.get('/increaseQuantity/:bookName',async(req,res)=>{
  //   const bookName = req.params.bookName;
  //   const result = await booksCollection.findOne({name:bookName })
  //   res.send(result)
  // })
  


    // Send a ping to confirm a successful connection

    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


// mongodb(database) //

app.get('/', (req, res) => {
  res.send('Library management server is running')
})

app.listen(port, () => {
  console.log(`Library management server is running port ${port}`)
})