/********************************************************************************* 

WEB322 – Assignment 03

I declare that this assignment is my own work in accordance with Seneca
Academic Policy. No part of this assignment has been copied manually or 
electronically from any other source (including 3rd party websites) or 
distributed to other students. I acknowledge that violation of this policy
to any degree results in a ZERO for this assignment and possible failure of
the course. 

Name:   akash yadav
Student ID:   172566218
Date:  16-06-2023
Cyclic Web App URL:  https://zany-slug-slacks.cyclic.app/
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

// Configure express-handlebars
app.engine('hbs', exphbs.engine({ extname: '.hbs' }));
app.set('view engine', 'hbs');

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
  res.render('addItem');
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
      // Add other properties from req.body as needed
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
    // Filter items by category
    storeService
      .getItemsByCategory(category)
      .then((filteredItems) => {
        res.render('items', { items: filteredItems, message: null });
      })
      .catch(() => {
        res.render('items', { items: [], message: 'No items found.' });
      });
  } else if (minDate) {
    // Filter items by minimum date
    storeService
      .getItemsByMinDate(minDate)
      .then((filteredItems) => {
        res.render('items', { items: filteredItems, message: null });
      })
      .catch(() => {
        res.render('items', { items: [], message: 'No items found.' });
      });
  } else {
    // Return all items without any filter
    storeService
      .getAllItems()
      .then((items) => {
        res.render('items', { items: items, message: null });
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
  
  app.get('/categories', (req, res) => {
    storeService
      .getCategories()
      .then((categories) => {
        res.render('categories', { categories: categories, message: null });
      })
      .catch(() => {
        res.render('categories', { categories: [], message: 'No categories found.' });
      });
  });
  
  
  app.get("/shop", async (req, res) => {
    // Declare an object to store properties for the view
    let viewData = {};
  
    try {
      // declare empty array to hold "post" objects
      let items = [];
  
      // if there's a "category" query, filter the returned posts by category
      if (req.query.category) {
        // Obtain the published "posts" by category
        items = await storeService.getPublishedItemsByCategory(req.query.category);
      } else {
        // Obtain the published "items"
        items = await storeService.getPublishedItems();
      }
  
      // sort the published items by postDate
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
