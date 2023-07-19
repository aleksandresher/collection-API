const express = require("express");

const router = express.Router();
const collectionController = require("../controllers/collections");

router.put("/create", collectionController.createdCollections);
router.get(
  "/getCollections/:userId",
  collectionController.getCollectionsByUserId
);
router.get(
  "/singleCollection/:collectionId",
  collectionController.getSingleCollection
);
router.post("/addItem/:collectionId", collectionController.addItemToCollection);
router.delete("/delete/:collectionId", collectionController.deleteCollection);
router.delete("/delete/:collectionId/:itemId", collectionController.deleteItem);
router.put("/rate/:userId/:collectionId", collectionController.RatingHandler);
router.get(
  "/getItems/:collectionId",
  collectionController.getItemsFromCollection
);
router.put(
  "/likeItem/:userId/:collectionId/:itemId",
  collectionController.addLikeToItem
);
router.get(
  "/getItem/:collectionId/:itemId",
  collectionController.getSingleItemFromCollection
);
router.put(
  "/addComment/:collectionId/:itemId",
  collectionController.addCommentToItem
);
router.get(
  "/getComments/:collectionId/:itemId",
  collectionController.getComments
);
router.get(
  "/getBiggestCollectionsIds",
  collectionController.getBiggestCollections
);
router.get("/lastCollections", collectionController.getLastItems);
router.get("/getTags", collectionController.getAllTags);
router.get("/search", collectionController.searchItemsByTag);
router.get("/items/:itemsIds", collectionController.findItemsByIds);
router.get("/item/:itemId", collectionController.getItemById2);
router.get("/tags", collectionController.searchTags);
router.get("/search/:query", collectionController.searchCollections);
router.put("/:collectionId/:itemId/update", collectionController.updateItem);

module.exports = router;
