/*********************************************************************************
 *  WEB322 – Assignment 6
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.
 *  No part of this assignment has been copied manually or electronically from any other source
 *  (including web sites) or distributed to other students.
 *
 *  Name: akash yadav
 *  Student ID: 172566218 
 *  Date: august 03 2023
 *
 * ONLINE (CYCLIC) LINK: 
 *
 ********************************************************************************/
const Sequelize = require("sequelize");
var sequelize = new Sequelize(
  "fxmtqeba",
  "fxmtqeba",
  "sBpK2SD-1qJPwJnxkW9REo0zeiL4b4hP",
  {
    host: "stampy.db.elephantsql.com",
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
    query: { raw: true },
  }
);

var Item = sequelize.define("Item", {
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  postDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
  price: Sequelize.DOUBLE,
});

var Category = sequelize.define("Category", {
  category: Sequelize.STRING,
});

Item.belongsTo(Category, { foreignKey: "category" });

function initialize() {
  return new Promise((resolve, reject) => {
    sequelize
      .sync()
      .then(() => {
        console.log("Models Synced with the DB");
        resolve();
      })
      .catch((err) => {
        console.error("Error syncing models with DB", err);
        reject("Unable to sync the database");
      });
  });
}

function getAllItems() {
  return new Promise((resolve, reject) => {
    Item.findAll()
      .then((items) => {
        resolve(items);
      })
      .catch((err) => {
        console.error("Error getting items", err);
        reject("No results found.");
      });
  });
}

function getPublishedItems() {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: {
        published: true,
      },
    })
      .then((pubItems) => {
        resolve(pubItems);
      })
      .catch((err) => {
        console.error("Error getting published items", err);
        reject("No results found.");
      });
  });
}

function getCategories() {
  return new Promise((resolve, reject) => {
    Category.findAll()
      .then((cat) => {
        resolve(cat);
      })
      .catch((err) => {
        console.error("Error getting categories", err);
        reject("No results found.");
      });
  });
}

function getItemsByCategory(categoryId) {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: {
        category: categoryId,
      },
    })
      .then((catItems) => {
        resolve(catItems);
      })
      .catch((err) => {
        console.error("Error getting items by categories", err);
        reject("No results found.");
      });
  });
}

function getItemsByMinDate(minDateStr) {
  return new Promise((resolve, reject) => {
    const { gte } = Sequelize.Op;
    Item.findAll({
      where: {
        postDate: {
          [gte]: new Date(minDateStr),
        },
      },
    })
      .then((itemsByDate) => {
        resolve(itemsByDate);
      })
      .catch((err) => {
        console.error("Error getting Items by Date", err);
        reject("No results found.");
      });
  });
}

function getItemById(iid) {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: {
        id: iid,
      },
    })
      .then((items) => {
        if (items.length > 0) {
          resolve(items[0]);
        } else {
          reject("No results found.");
        }
      })
      .catch((err) => {
        console.error("Error getting Items by Date", err);
        reject("No results found.");
      });
  });
}

function addItem(itemData) {
  return new Promise((resolve, reject) => {
    itemData.published = itemData.published ? true : false;
    for (let attr in itemData) {
      if (itemData[attr] === "") {
        itemData[attr] = null;
      }
    }
    itemData.postDate = new Date();
    Item.create(itemData)
      .then(() => {
        resolve();
      })
      .catch((err) => {
        console.error("Error creating item:", err);
        reject("Unable to create item");
      });
  });
}

function getPublishedItemsByCategory(categoryId) {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: {
        published: true,
        category: categoryId,
      },
    })
      .then((pubItems) => {
        resolve(pubItems);
      })
      .catch((err) => {
        console.error("Error getting published items by category", err);
        reject("No results found.");
      });
  });
}

function addCategory(categoryData) {
  return new Promise((resolve, reject) => {
    for (let attr in categoryData) {
      if (categoryData[attr] === "") {
        categoryData[attr] = null;
      }
    }
    Category.create(categoryData)
      .then(() => {
        resolve();
      })
      .catch((err) => {
        console.error("Error creating category:", err);
        reject("Unable to create category");
      });
  });
}

function deleteCategoryById(iid) {
  return new Promise((resolve, reject) => {
    Category.destroy({
      where: {
        id: iid,
      },
    })
      .then((deleted) => {
        if (deleted > 0) {
          resolve();
        } else {
          reject("Category not found"); 
        }
      })
      .catch((error) => {
        console.error("Error deleting category:", error);
        reject("Unable to delete category"); 
      });
  });
}

function deleteItemById(iid) {
  return new Promise((resolve, reject) => {
    Item.destroy({
      where: {
        id: iid,
      },
    })
      .then((deleted) => {
        if (deleted > 0) {
          resolve(); 
        } else {
          reject("Item not found"); 
        }
      })
      .catch((error) => {
        console.error("Error deleting Item:", error);
        reject("Unable to delete item"); 
      });
  });
}

module.exports = {
  Item,
  Category,
  initialize,
  getAllItems,
  getPublishedItems,
  getCategories,
  getItemsByCategory,
  getItemsByMinDate,
  getItemById,
  addItem,
  getPublishedItemsByCategory,
  addCategory,
  deleteCategoryById,
  deleteItemById,
};
