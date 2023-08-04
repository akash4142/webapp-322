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

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  loginHistory: [
    {
      dateTime: {
        type: Date,
        default: Date.now,
      },
      userAgent: String,
    },
  ],
});

let User;

function initialize() {
  return new Promise(function (resolve, reject) {
    let db = mongoose.createConnection(
      "mongodb+srv://yadavakki440:ozvk3YvBRg9tgOIF@senecaweb.k3e0pob.mongodb.net/"
    );

    db.on("error", (err) => {
      reject(err); // reject the promise with the provided error
    });
    db.once("open", () => {
      User = db.model("users", userSchema);
      resolve();
    });
  });
}

function registerUser(userData) {
  return new Promise((resolve, reject) => {
    if (userData.password !== userData.password2) {
      throw new Error("Passwords do not match");
    }
    bcrypt
      .hash(userData.password, 10)
      .then((hash) => {
        const newUser = new User({
          username: userData.userName,
          password: hash,
          email: userData.email,
          loginHistory: [],
        });

        newUser.save();
      })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        if (err.code === 11000) {
          reject(new Error("User Name already taken"));
        } else {
          reject(new Error("There was an error creating the user: " + err));
        }
      });
  });
}

function checkUser(userData) {
  return new Promise((resolve, reject) => {
    User.find({ username: userData.userName })
      .exec()
      .then((users) => {
        if (users.length === 0) {
          reject(new Error(`Unable to find user: ${userData.userName}`));
        } else {
          const hashedPass = users[0].password;
          bcrypt
            .compare(userData.password, hashedPass)
            .then((result) => {
              if (result) {
                const loginInfo = {
                  dateTime: new Date().toString(),
                  userAgent: userData.userAgent,
                };
                users[0].loginHistory.push(loginInfo);

                User.updateOne(
                  { userName: users[0].userName },
                  { $set: { loginHistory: users[0].loginHistory } }
                )
                  .exec()
                  .then(() => resolve(users[0]))
                  .catch((err) => {
                    reject(
                      new Error(
                        `There was an error updating the user loginHistory: ${err}`
                      )
                    );
                  });
              } else {
                reject(
                  new Error(`Incorrect Password for user: ${userData.userName}`)
                );
              }
            })
            .catch((err) => {
              reject(
                new Error(`There was an error verifying the user: ${err}`)
              );
            });
        }
      })
      .catch((err) =>
        reject(new Error(`Unable to find user: ${userData.userName}`))
      );
  });
}

module.exports = {
  initialize,
  registerUser,
  checkUser,
};
