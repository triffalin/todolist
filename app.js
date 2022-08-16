//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
/* integrate mongoose to app */
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
/* connect to mongodb */
mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", {useNewUrlParser: true});
/* mongoose schema */
const itemsSchema = {
  name: String
};
/* create mongoose model base on schema */
const Item = mongoose.model("Item", itemsSchema);
/* create the 3 default items */
const item1 = new Item({
  name: "Welcome to your To Do List!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});
/* put all elements togheter in array */
const defaultItems = [item1, item2, item3];

/* create schema for custom list */
const listSchema = {
  name: String,
  items: [itemsSchema]
};

/* create model for list schema */
const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {
  /* put the default elements on front page */
  Item.find({}, function(err, foundItems) {

    if (foundItems.length === 0) {
      /* insert default elements to db everytime */
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB");
        }
      });
      res.redirect("/");
    } else {
        res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

/* create the custom list */
app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  /* prevent to create duplicate page */
  List.findOne({name: customListName}, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        /* create custom list on base listSchema */
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        /* Show an existing list */
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });

});

/* insert new item to the list */
app.post("/", (req, res) => {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

/* delete item to the list */
app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log("Successfully deleted checked item");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});


/** rendering about page  */
app.get("/about", (req, res) => {
  res.render("about");
});

/** setup the port of server */
app.listen(3000, () => {
  console.log("Server started on port 3000.");
});
