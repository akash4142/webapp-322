/********************************************************************************* 

WEB322 – Assignment 05

I declare that this assignment is my own work in accordance with Seneca
Academic Policy. No part of this assignment has been copied manually or 
electronically from any other source (including 3rd party websites) or 
distributed to other students. I acknowledge that violation of this policy
to any degree results in a ZERO for this assignment and possible failure of
the course. 

Name:   akash yadav
Student ID:   172566218
Date:  16-06-2023
Cyclic Web App URL:  https://fair-red-betta-cap.cyclic.app
GitHub Repository URL:  https://github.com/akash4142/web322-app

********************************************************************************/

const express = require('express');
const Handlebars = require('handlebars');
const exphbs = require('express-handlebars');
const storeService = require('./store-service');
const path = require('path');
const app = express();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const upload = multer();
const bodyParser = require('body-parser');

// Configure express-handlebars
app.engine('hbs', exphbs.engine({ extname: '.hbs' }));
app.set('view engine', 'hbs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.engine('.hbs', exphbs.engine({ 
  extname: '.hbs',
  helpers: { 
      navLink: function (url, options) {
        return(
          '<li class="nav-item"><a ' + 
          (url == app.locals.activeRoute ? ' class="nav-link active" ': ' class="nav-link" ')+
          ' href= " '+ 
          url + 
          '">' + 
          options.fn(this) + 
          "</a></li>"
        )
      },
  safeHTML: function (content) {
    return new Handlebars.SafeString(content);
  },
  formatDate: function(dateObj){
    let year = dateObj.getFullYear();
    let month = (dateObj.getMonth() + 1).toString();
    let day = dateObj.getDate().toString();
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2,'0')}`;
   }
  }
}));

cloudinary.config({
  cloud_name: 'dw7mvgct4',
  api_key: '193259821489367',
  api_secret: '4eNYjlIs2RIbSoe5oMrZDLS8R8w',
  secure: true
});

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.static('public'));

app.use(function(req,res,next){
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
 });
 



app.get('/', (req, res) => {
  res.redirect('/shop');
});

app.get('/about', (req, res) => {
  res.render('about');
});


app.get('/items/add', (req, res) => {
  storeService.getCategories()
    .then((categories) => {
      res.render('addItem', { categories: categories });
    })
    .catch(() => {
      res.render('addItem', { categories: [] });
    });
});


app.post('/items/add', upload.single('featureImage'), (req, res) => {
  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        });
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    async function upload(req) {
      let result = await streamUpload(req);
      console.log(result);
      return result;
    }

    upload(req)
      .then((uploaded) => {
        processItem(uploaded.url);
      })
      .catch((error) => {
        console.log(error);
        res.status(500).json({ message: 'Image upload failed' });
      });
  } else {
    processItem('');
  }

  function processItem(imageUrl) {
    const newItem = {
      featureImage: imageUrl,
      title: req.body.title,
    price: req.body.price,
    category: req.body.category,
      
    };

    storeService
      .addItem(newItem)
      .then(() => {
        res.redirect('/items');
      })
      .catch((error) => {
        console.log(error);
        res.status(500).json({ message: 'Failed to add item' });
      });
  }
});


app.get('/items', (req, res) => {
  const category = req.query.category;
  const minDate = req.query.minDate;

  if (category) {
   
    storeService
      .getItemsByCategory(category)
      .then((filteredItems) => {
        if (filteredItems.length > 0) {
          res.render('items', { items: filteredItems, message: null });
        } else {
          res.render('items', { items: [], message: 'No items found.' });
        }
      })
      .catch(() => {
        res.render('items', { items: [], message: 'No items found.' });
      });
  } else if (minDate) {
   
    storeService
      .getItemsByMinDate(minDate)
      .then((filteredItems) => {
        if (filteredItems.length > 0) {
          res.render('items', { items: filteredItems, message: null });
        } else {
          res.render('items', { items: [], message: 'No items found.' });
        }
      })
      .catch(() => {
        res.render('items', { items: [], message: 'No items found.' });
      });
  } else {
   
    storeService
      .getAllItems()
      .then((items) => {
        if (items.length > 0) {
          res.render('items', { items: items, message: null });
        } else {
          res.render('items', { items: [], message: 'No items found.' });
        }
      })
      .catch(() => {
        res.render('items', { items: [], message: 'No items found.' });
      });
  }
});


  

  app.get('/item/:id', (req, res) => {
    const itemId = req.params.id;
    storeService
      .getItemById(itemId)
      .then((item) => {
        res.json(item);
      })
      .catch((err) => {
        res.status(500).json({ message: err });
      });
  });
  
  
  
  app.get("/shop", async (req, res) => {
    
    let viewData = {};
  
    try {
      
      let items = [];
  
      if (req.query.category) {
        
        items = await storeService.getPublishedItemsByCategory(req.query.category);
      } else {
       
        items = await storeService.getPublishedItems();
      }
  
      
      items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
  
      // get the latest post from the front of the list (element 0)
      let post = items[0];
  
      // store the "items" and "post" data in the viewData object (to be passed to the view)
      viewData.items = items;
      viewData.item = post;
    } catch (err) {
      viewData.message = "no results";
    }
  
    try {
      // Obtain the full list of "categories"
      let categories = await storeService.getCategories();
  
      // store the "categories" data in the viewData object (to be passed to the view)
      viewData.categories = categories;
    } catch (err) {
      viewData.categoriesMessage = "No results";
    }
  
    // render the "shop" view with all of the data (viewData)
    res.render("shop", { data: viewData });
  });



  app.get('/shop/:id', async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = {};
  
    try{
  
        // declare empty array to hold "item" objects
        let items = [];
  
        // if there's a "category" query, filter the returned posts by category
        if(req.query.category){
            // Obtain the published "posts" by category
            items = await storeService.getPublishedItemsByCategory(req.query.category);
        }else{
            // Obtain the published "posts"
            items = await storeService.getPublishedItems();
        }
  
        // sort the published items by postDate
        items.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));
  
        // store the "items" and "item" data in the viewData object (to be passed to the view)
        viewData.items = items;
  
    }catch(err){
        viewData.message = "no results";
    }
  
    try{
        // Obtain the item by "id"
        viewData.item = await storeService.getItemById(req.params.id);
    }catch(err){
        viewData.message = "no results"; 
    }
  
    try{
        // Obtain the full list of "categories"
        let categories = await storeService.getCategories();
  
        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results"
    }
  
    // render the "shop" view with all of the data (viewData)
    res.render("shop", {data: viewData})
  });

// Add the route for displaying the "Add Category" form
app.get('/categories/add', (req, res) => {
  res.render('addCategory');
});

// Add the route for handling the form submission and adding a new category
// Assuming you already have your required modules and setup done...

app.post("/categories/add", (req, res) => {
  // Extract the category from the form data using req.body
  const categoryData = {
    category: req.body.category || "", // Make sure to use req.body to access the form data
  };

  if (categoryData.category !== "") {
    storeService
      .addCategory(categoryData)
      .then(() => {
        res.redirect("/categories");
      })
      .catch((error) => {
        console.log("Some error occurred:", error);
        res.status(500).send("Unable to create category");
      });
  } else {
    console.log("Category field cannot be empty");
    res.status(400).send("Category field cannot be empty");
  }
});




// Add the route for deleting a Category by Id
app.get('/categories/delete/:id', (req, res) => {
  
  storeService.deleteCategoryById(req.params.id)
    .then((deletedCategory) => {
      if (deletedCategory) {
        res.redirect('/categories');
      } else {
        res.status(404).send('Category not found');
      }
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send('Unable to Remove Category / Internal server error');
    });
});

app.get('/categories', (req, res) => {
  storeService
    .getCategories()
    .then((categories) => {
      if (categories.length > 0) {
        res.render('categories', { categories: categories, message: null });
      } else {
        res.render('categories', { categories: [], message: 'No categories found.' });
      }
    })
    .catch(() => {
      res.render('categories', { categories: [], message: 'No categories found.' });
    });
});


// Add the route for deleting a Post by Id
app.get('/items/delete/:id', (req, res) => {

  if (!req.params.id) {
    console.log('Invalid item ID:', req.params.id);
    return res.status(400).send('Invalid item ID');
  }

  storeService
    .deletePostById(req.params.id)
    .then(() => {
      console.log('Item deleted successfully:', req.params.id);
      res.redirect('/items');
    })
    .catch((error) => {
      console.log('Error while deleting item:', error);
      res.status(500).send('Unable to Remove Item / Item not found');
    });
});





app.use((req, res) => {
  res.status(404).render('404');
});

storeService
  .initialize()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log('Server listening on port: ' + HTTP_PORT);
    });
  })
  .catch((err) => {
    console.log(err);
  });
