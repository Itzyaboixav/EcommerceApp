const express = require('express');
const mysql = require('mysql2');
const app = express();
const multer = require('multer')
const bodyParser = require('body-parser')
const { check , validationResult } = require('express-validator')

const storage = multer.diskStorage({
    destination:(req,file,cb)=> {
        cb(null,'public/images'); //Directory to save uploaded files
    },
    filename: (req,file,cb)=> {
        cb(null,file.originalname);
    }
});

const upload = multer({storage:storage})

//Creation of the MYSQL connection
const connection = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:"c237_miniproject"
    
});

connection.connect((err)=> {
    if (err){
        console.error('Error connecting to MYSQL:',err);
        return;
    }
    console.log('Connected to MySQL database');
});

//Setting up 'view' engine 
app.set('view engine','ejs');
//Enable form processing 
app.use(express.urlencoded({
    extended:false
}));
//Enable static files
app.use(express.static('public'));

// middleware & static files 

// Get all information from the table 'products' table 
app.get('/', (req,res)=>{
    connection.query('SELECT * FROM products',(error,results)=>{
        if(error) throw error;
        res.render('index',{products:results}); 
    });
});

// Get all information from the table 'contactUs' table 
app.get('/', (req,res)=>{
    connection.query('SELECT * FROM contactus',(error,results)=>{
        if(error) throw error;
        res.render('contactUs',{contactus:results}); 
    });
});

app.get('/contact/:id',(req,res)=>{
    //Exttract the product ID from the request parameters
    const contactId = req.params.id;
    const sql='SELECT * FROM contactus WHERE contactId = ?';
    //Fetch data from MYSQL based on the product ID
    connection.query(sql , [contactId],(error,results)=>{
        if(error){
            console.error('Database query error:' , error.message);
            return res.status(500).send('Error Retrieving product By ID');
    }
    //Check if any product with the given ID was found
    if (results.length>0){
        //Render HTML page with the product data
        res.render('afterContact', {contact: results[0]});
    }else{
        //If no product with the given ID was found , render a 404 page or handle it accordingly
        res.status(404).send('Product not found');
    }
    });
});



app.get('/product/:id',(req,res)=>{
    //Exttract the product ID from the request parameters
    const id = req.params.id;
    const sql='SELECT * FROM products WHERE id = ?';
    //Fetch data from MYSQL based on the product ID
    connection.query(sql , [id],(error,results)=>{
        if(error){
            console.error('Database query error:' , error.message);
            return res.status(500).send('Error Retrieving product By ID');
    }
    //Check if any product with the given ID was found
    if (results.length>0){
        //Render HTML page with the product data
        res.render('product',{product: results[0]});
    }else{
        //If no product with the given ID was found , render a 404 page or handle it accordingly
        res.status(404).send('Product not found');
    }
    });
});




app.get('/contactUs',(req,res)=> {
    res.render('contactUs');
});



app.get('/aboutUs',(req,res)=> {
    res.render('aboutUs');
});


app.get('/addProduct',(req,res)=> {
    res.render('addProduct');
});

app.get('/afterContact',(req,res)=> {
    res.render('afterContact')
})

app.post('/afterContact',(req,res)=>{
    const {ContactName,email,ContactNo,comment}=req.body;
    const sql='INSERT INTO contactus(ContactName,email,ContactNo,comment)VALUES(?,?,?,?)';
    connection.query(sql,[ContactName,email,ContactNo,comment],(error,results)=>{
        if(error){
            console.error('Error publishing your comments to us , Try again later:' , error);
            res.status(500).send('Error publishing your comments');
        } else {
            //Send a success response
            res.redirect('/afterContact');
        }
    });
});


 




app.post('/addProduct',upload.single('image'),(req,res)=> {
    //Extract product data from the request body
    const {name , description , price }= req.body;
    let image;
    if (req.file){
        image= req.file.filename; //Save only the filename
    } else {
        image=null;
    }
    const sql='INSERT INTO products (name,description,price,image)VALUES (?,?,?,?)';
    //Insert the new product into the database
    connection.query(sql , [name,description,price,image],(error,results)=>{
        if(error){
            //Handle any error that occurs during the database operation
            console.error('Error adding product:',error);
            res.status(500).send('Error adding product');
        } else {
            //Send a success response
            res.redirect('/');
        }
    });
});

app.get('/deleteProduct/:id',(req,res)=> {
    const id = req.params.id;
    const sql ='DELETE FROM products WHERE id= ?';
    connection.query(sql,[id],(error,results)=> {
        if(error){
            //Handle any error that occurs during the database operation
            console.error("Error deleting product:",error);
            res.status(500).send('Error deleting product');
        } else{
            // Send a success response
            res.redirect('/')
        }
    });
});

app.get('/editProduct/:id', (req,res) => {
    const id = req.params.id;
    const sql = 'SELECT * FROM products WHERE id = ?';
    // Fetch data from MySQL based on the product ID
    connection.query( sql , [id], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving product by ID');
        }
        // Check if any product with the given ID was found
        if (results.length > 0) {
            // Render HTML page with the product data
            res.render('editProduct', { product: results[0] });
        } else {
            // If no product with the given ID was found, render a 404 page or handle it accordingly
            res.status(404).send('Product not found');
        }
    });
});

app.post('/editProduct/:id',upload.single('image'), (req, res) => {
    const id = req.params.id;
    // Extract product data from the request body
    const { name, description , price } = req.body;
    let image = req.body.currentImage; //retrieve current image filenmae
    if (req.file){
       image = req.file.filename; // set image to be new image filename
    }
 
    const sql = 'UPDATE products SET name = ? , description = ?, price = ? , image =? WHERE id = ?';
 
    // Insert the new product into the database
    connection.query( sql , [name, description, price, image ,  id], (error, results) => {
        if (error) {
            // Handle any error that occurs during the database operation
            console.error("Error updating product:", error);
            res.status(500).send('Error updating product');
        } else {
            // Send a success response
            res.redirect('/');
        }
    });
});






const PORT = process.env.PORT || 3000;
app.listen(PORT,()=> console.log(`Server running on port ${PORT}`));
