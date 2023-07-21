const Sequelize = require('sequelize');

var sequelize = new Sequelize('wlznycsk', 'wlznycsk', 'hG-_1y2JkF5qi_ZKDFy14Sb8sTFKOMVL', {
  host: 'rajje.db.elephantsql.com',
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
    ssl: { rejectUnauthorized: false }
  },
  query: { raw: true }
});

const Item = sequelize.define('Item', {
  body: {
    type: Sequelize.TEXT
  },
  title: {
    type: Sequelize.STRING
  },
  postDate: {
    type: Sequelize.DATE
  },
  featureImage: {
    type: Sequelize.STRING
  },
  published: {
    type: Sequelize.BOOLEAN
  },
  price: {
    type: Sequelize.DOUBLE
  }
});


const Category = sequelize.define('Category', {
  category: {
    type: Sequelize.STRING
  }
});


Item.belongsTo(Category, { foreignKey: 'category' });



module.exports.addCategory = function (categoryData) {
  return new Promise((resolve, reject) => {
    for (const prop in categoryData) {
      if (categoryData[prop] === '') {
        categoryData[prop] = null;
      }
    }

    Category.create(categoryData)
      .then(createdCategory => resolve(createdCategory))
      .catch(err => reject('Unable to create category'));
  });
};


module.exports.deleteCategoryById = function (id) {
  return new Promise((resolve, reject) => {
    Category.destroy({
      where: { id: id }
    })
      .then(deletedCategory => resolve(deletedCategory))
      .catch(err => reject('Unable to delete category'));
  });
};

module.exports.deletePostById = function (id) {
  return new Promise((resolve, reject) => {
    Item.destroy({
      where: { id: id }
    })
      .then(deletedPost => resolve(deletedPost))
      .catch(err => reject('Unable to delete post'));
  });
};

module.exports.initialize = function () {
  return new Promise((resolve, reject) => {
    sequelize
      .sync()
      .then(() => {
        console.log('Database synced successfully.');
        resolve();
      })
      .catch((err) => {
        console.error('Unable to sync the database:', err);
        reject('unable to sync the database');
      });
  });
};


module.exports.deleteItemById = function (id) {
  return new Promise((resolve, reject) => {
    Item.destroy({
      where: { id: id }
    })
      .then(deletedItem => resolve(deletedItem))
      .catch(err => reject('Unable to delete item'));
  });
};

module.exports.getAllItems = function () {
  return new Promise((resolve, reject) => {
    Item.findAll()
      .then(items => resolve(items))
      .catch(err => reject('No results returned'));
  });
};

module.exports.getPublishedItems = function () {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: { published: true }
    })
      .then(items => resolve(items))
      .catch(err => reject('No results returned'));
  });
};

module.exports.getCategories = function () {
  return new Promise((resolve, reject) => {
    Category.findAll()
      .then(categories => resolve(categories))
      .catch(err => reject('No results returned'));
  });
};

module.exports.addItem = function (itemData) {
  return new Promise((resolve, reject) => {
    // Ensure the "published" property is set correctly
    itemData.published = (itemData.published) ? true : false;

    // Set blank values ("") to null
    for (const prop in itemData) {
      if (itemData[prop] === '') {
        itemData[prop] = null;
      }
    }

    
    itemData.postDate = new Date();
   
   
    Item.create(itemData)
      .then(()=>{
        resolve();
      })
      .catch(err => reject('Unable to create item'));
  });
};


module.exports.getItemsByCategory = function (category) {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: { category: category }
    })
      .then(items => resolve(items))
      .catch(err => reject('No results returned'));
  });
};

module.exports.getPublishedItemsByCategory = function(category) {
  return new Promise((resolve, reject) => {
    const filteredItems = items.filter(item => item.published && item.category === category);

    if (filteredItems.length === 0) {
      reject('No results returned');
    }

    resolve(filteredItems);
  });
};


module.exports.getItemsByMinDate = function (minDateStr) {
  return new Promise((resolve, reject) => {
    const { gte } = Sequelize.Op;
    const minDate = new Date(minDateStr);
    Item.findAll({
      where: { postDate: { [gte]: minDate } }
    })
      .then(items => resolve(items))
      .catch(err => reject('No results returned'));
  });
};

module.exports.getItemById = function (id) {
  return new Promise((resolve, reject) => {
    Item.findByPk(id)
      .then(item => resolve(item))
      .catch(err => reject('No result returned'));
  });
};

