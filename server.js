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
const storeService = require('./store-service');
const path = require('path');
const app = express();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const upload = multer();

cloudinary.config({
  cloud_name: 'dw7mvgct4',
  api_key: '193259821489367',
  api_secret: '4eNYjlIs2RIbSoe5oMrZDLS8R8w',
  secure: true
});

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.redirect('/about');
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/about.html'));
});

app.get('/items/add', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/addItem.html'));
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

app.get('/store', (req, res) => {
  storeService
    .getPublishedItems()
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      res.json({ message: err });
    });
});

app.get('/items', (req, res) => {
    const category = req.query.category;
    const minDate = req.query.minDate;
  
    if (category) {
      // Filter items by category
      storeService
        .getItemsByCategory(category)
        .then((filteredItems) => {
          res.json(filteredItems);
        })
        .catch((err) => {
          res.status(500).json({ message: err });
        });
    } else if (minDate) {
      // Filter items by minimum date
      storeService
        .getItemsByMinDate(minDate)
        .then((filteredItems) => {
          res.json(filteredItems);
        })
        .catch((err) => {
          res.status(500).json({ message: err });
        });
    } else {
      // Return all items without any filter
      storeService
        .getAllItems()
        .then((items) => {
          res.json(items);
        })
        .catch((err) => {
          res.status(500).json({ message: err });
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
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      res.json({ message: err });
    });
});

app.use((req, res) => {
  res.status(404).send('404 - Page Not Found');
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
