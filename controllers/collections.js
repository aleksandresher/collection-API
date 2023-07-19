const { Collection } = require("../model/User");
const { User } = require("../model/User");
const io = require("../socket");
const mongoose = require("mongoose");

exports.createdCollections = async (req, res, next) => {
  const { collections, userId, dynamicFields } = req.body;

  try {
    let createdCollections;

    if (Array.isArray(collections)) {
      createdCollections = await Promise.all(
        collections.map((collection) =>
          Collection.create({
            ...collection,
            colauthor: userId,
            dynamicFields: dynamicFields,
          })
        )
      );
    } else {
      createdCollections = await Collection.create({
        ...collections,
        colauthor: userId,
        dynamicFields: dynamicFields,
      });
    }

    res.status(200).json({
      message: "Collections created successfully.",
      collections: createdCollections,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.getCollectionsByUserId = async (req, res, next) => {
  const userId = req.params.userId;
  console.log(`userIdForCOls: ${userId}`);

  try {
    const collections = await Collection.find({ colauthor: userId });

    res.status(200).json({
      message: "Collections retrieved successfully.",
      collections: collections,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.getSingleCollection = (req, res, next) => {
  const collectionId = req.params.collectionId;

  Collection.findById(collectionId)
    .then((collection) => {
      if (!collection) {
        const error = new Error("Collection not found.");
        error.statusCode = 404;
        throw error;
      }
      const { dynamicFields, ...collectionData } = collection.toObject();

      res.status(200).json({
        message: "Collection fetched.",
        collection: collection,
        dynamicFields: dynamicFields,
      });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.addItemToCollection = (req, res, next) => {
  const collectionId = req.params.collectionId;
  const { name, dynamicFields, tags } = req.body.item;
  console.log(`name: ${name}, dynamicField: ${dynamicFields}`);

  Collection.findById(collectionId)
    .then((collection) => {
      if (!collection) {
        const error = new Error("Collection not found");
        error.statusCode = 404;
        throw error;
      }
      const newItem = {
        name: name,
        dynamicFields: dynamicFields,
        tags: tags,
      };

      collection.items.push(newItem);

      return collection.save();
    })
    .then((updatedCollection) => {
      const addedItem = updatedCollection.items.slice(-1)[0];
      res
        .status(200)
        .json({ message: "Item added to collection", item: addedItem });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.deleteCollection = async (req, res) => {
  const collectionId = req.params.collectionId;
  console.log(`collectionId for deleting: ${collectionId}`);

  try {
    const collection = await Collection.findById(collectionId);
    console.log(`collection: ${collection}`);

    if (!collection) {
      return res.status(404).json({ error: "Collection not found" });
    }
    await collection.deleteOne();

    return res.status(200).json({ message: "Collection deleted successfully" });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.deleteItem = async (req, res) => {
  const { collectionId, itemId } = req.params;

  try {
    const collection = await Collection.findById(collectionId);

    if (!collection) {
      return res.status(404).json({ error: "Collection not found" });
    }

    const updatedCollection = await Collection.findOneAndUpdate(
      { _id: collection._id },
      { $pull: { items: { _id: itemId } } },
      { new: true }
    );

    if (!updatedCollection) {
      return res.status(404).json({ error: "Item not found" });
    }

    return res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.RatingHandler = (req, res, next) => {
  const collectionId = req.params.collectionId;
  const userId = req.params.userId;
  const rating = parseInt(req.body.rating);

  Collection.findById(collectionId)
    .then((collection) => {
      if (!collection) {
        const error = new Error("Collection not found.");
        error.statusCode = 404;
        throw error;
      }
      const userRating = collection.ratings.find(
        (r) => r.user.toString() === userId
      );
      if (userRating) {
        const error = new Error("User has already rated the collection.");
        error.statusCode = 400;
        throw error;
      }
      collection.ratings.push({
        user: req.params.userId,
        rating: rating,
      });
      return collection.save();
    })
    .then((updatedCollection) => {
      res.status(200).json({
        message: "Collection rated.",
        collection: updatedCollection,
      });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.getItemsFromCollection = (req, res, next) => {
  const collectionId = req.params.collectionId;
  console.log(`collectionId: ${collectionId}`);

  Collection.findById(collectionId)
    .then((collection) => {
      if (!collection) {
        const error = new Error("Collection not found");
        error.statusCode = 404;
        throw error;
      }

      const items = collection.items;

      res.status(200).json({ items });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.addLikeToItem = (req, res, next) => {
  const itemId = req.params.itemId;
  const collectionId = req.params.collectionId;
  const userId = req.params.userId;

  Collection.findById(collectionId)
    .then((collection) => {
      if (!collection) {
        const error = new Error("Collection not found");
        error.statusCode = 404;
        throw error;
      }

      const item = collection.items.id(itemId);
      if (!item) {
        const error = new Error("Item not found");
        error.statusCode = 404;
        throw error;
      }

      const userHasLiked = item.likes.includes(userId);
      if (userHasLiked) {
        const error = new Error("User has already liked this item");
        error.statusCode = 400;
        throw error;
      }

      item.likes.push(userId);
      item.likeCount++;

      return collection.save();
    })
    .then((savedCollection) => {
      const savedItem = savedCollection.items.id(itemId);
      res.status(200).json({
        item: savedItem,
      });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.getSingleItemFromCollection = (req, res, next) => {
  const collectionId = req.params.collectionId;
  const itemId = req.params.itemId;

  Collection.findById(collectionId)
    .then((collection) => {
      if (!collection) {
        const error = new Error("Collection not found");
        error.statusCode = 404;
        throw error;
      }

      const item = collection.items.id(itemId);
      if (!item) {
        const error = new Error("Item not found");
        error.statusCode = 404;
        throw error;
      }

      res.status(200).json({ item });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.addCommentToItem = (req, res, next) => {
  const collectionId = req.params.collectionId;
  const itemId = req.params.itemId;
  const { comment, userId } = req.body;
  console.log(`collectionId: ${collectionId} itemId: ${itemId}`);

  User.findById(userId)
    .then((user) => {
      if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
      }

      Collection.findById(collectionId)
        .then((collection) => {
          if (!collection) {
            const error = new Error("Collection not found");
            error.statusCode = 404;
            throw error;
          }

          const item = collection.items.id(itemId);
          if (!item) {
            const error = new Error("Item not found");
            error.statusCode = 404;
            throw error;
          }
          console.log(`item: ${item}`);

          const newComment = {
            content: comment,
            author: user.name,
          };

          item.comments.push(newComment);

          return collection.save();
        })
        .then((savedCollection) => {
          const savedItem = savedCollection.items.id(itemId);
          io.getIO().emit("commentAdd", {
            action: "commentAdd",
            comment: savedItem,
          });
          res.status(200).json({
            item: savedItem,
          });
        })
        .catch((error) => {
          if (!error.statusCode) {
            error.statusCode = 500;
          }
          next(error);
        });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.getComments = (req, res, next) => {
  const collectionId = req.params.collectionId;
  const itemId = req.params.itemId;

  Collection.findById(collectionId)
    .then((collection) => {
      if (!collection) {
        const error = new Error("Collection not found");
        error.statusCode = 404;
        throw error;
      }

      const item = collection.items.id(itemId);
      if (!item) {
        const error = new Error("Item not found");
        error.statusCode = 404;
        throw error;
      }

      const comments = item.comments.map((comment) => {
        return {
          content: comment.content,
          author: comment.author,
        };
      });

      res.status(200).json({ comments: comments });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.getBiggestCollections = async (req, res) => {
  try {
    const biggestCollections = await Collection.aggregate([
      {
        $project: {
          _id: 1,
          itemCount: { $size: "$items" },
        },
      },
      {
        $sort: {
          itemCount: -1,
        },
      },
      {
        $limit: 5,
      },
    ]);

    const collectionIds = biggestCollections.map(
      (collection) => collection._id
    );

    const collections = await Collection.find({ _id: { $in: collectionIds } });

    res.json(collections);
    console.log(biggestCollections);
  } catch (error) {
    console.error("Error getting biggest collections:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getLastItems = async (req, res) => {
  try {
    const lastItems = await Collection.aggregate([
      {
        $unwind: "$items",
      },
      {
        $sort: {
          "items.createdAt": -1,
        },
      },
      {
        $limit: 3,
      },
      {
        $group: {
          _id: null,
          lastCreatedItems: {
            $push: "$items",
          },
        },
      },
      {
        $project: {
          _id: 0,
          lastCreatedItems: 1,
        },
      },
    ]);

    res.json(lastItems);
  } catch (error) {
    console.error("Error getting last items:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getAllTags = async (req, res) => {
  try {
    const tags = await Collection.aggregate([
      {
        $unwind: "$items",
      },
      {
        $unwind: "$items.tags",
      },
      {
        $group: {
          _id: null,
          tags: { $addToSet: "$items.tags" },
        },
      },
      {
        $project: {
          _id: 0,
          tags: 1,
        },
      },
    ]);

    if (tags.length === 0) {
      res.json({ tags: [] });
    } else {
      res.json({ tags: tags[0].tags });
    }
  } catch (error) {
    console.error("Error getting tags:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.searchItemsByTag = async (req, res) => {
  const { tag } = req.query;

  try {
    const collections = await Collection.find({ "items.tags": tag });
    const items = [];
    collections.forEach((collection) => {
      collection.items.forEach((item) => {
        if (item.tags.includes(tag)) {
          items.push(item);
        }
      });
    });

    res.status(200).json({ items });
  } catch (error) {
    console.error("Error searching items by tag:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.findItemsByIds = async (req, res, next) => {
  const itemIds = req.params.itemsIds.replace(/[\[\]"]+/g, "").split(",");
  console.log(`itemIds: ${itemIds}`);

  try {
    const foundItems = await Collection.aggregate([
      {
        $unwind: "$items",
      },
      {
        $match: {
          "items._id": {
            $in: itemIds.map((itemId) => new mongoose.Types.ObjectId(itemId)),
          },
        },
      },
    ]);

    if (!foundItems || foundItems.length === 0) {
      const error = new Error("Items not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      itemss: foundItems,
    });
  } catch (error) {
    console.log(error);
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.getItemById2 = (req, res, next) => {
  const itemId = req.params.itemId;

  Collection.findOne({ "items._id": itemId })
    .then((collection) => {
      if (!collection) {
        const error = new Error("Collection not found");
        error.statusCode = 404;
        throw error;
      }

      const item = collection.items.find(
        (item) => item._id.toString() === itemId
      );
      if (!item) {
        const error = new Error("Item not found");
        error.statusCode = 404;
        throw error;
      }

      res.status(200).json({
        item: item,
      });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.searchTags = async (req, res) => {
  const { query } = req.query;
  try {
    const searchResults = await Collection.aggregate([
      {
        $unwind: "$items",
      },
      {
        $match: {
          "items.tags": {
            $regex: query,
            $options: "i",
          },
        },
      },
      {
        $project: {
          collectionId: "$_id",
          matchingTag: {
            $filter: {
              input: "$items.tags",
              as: "tag",
              cond: {
                $regexMatch: { input: "$$tag", regex: query, options: "i" },
              },
            },
          },
        },
      },
    ]);

    res.json(searchResults);
  } catch (error) {
    console.error("Error performing search:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.searchCollections = async (req, res) => {
  const { query } = req.params;

  try {
    const collections = await Collection.aggregate([
      {
        $search: {
          index: "searchInColls",
          text: {
            query: query,
            path: {
              wildcard: "*",
            },
          },
        },
      },
    ]);
    console.log(collections);

    if (collections.length === 0) {
      return res.status(404).json({ error: "No matching item found" });
    }

    const matchedItems = collections.reduce((result, collection) => {
      const regex = new RegExp(query, "i");
      const matchedItemsInCollection = collection.items.filter((item) => {
        return regex.test(item.name) || regex.test(item.content);
      });
      // console.log(`matchedItems: ${matchedItems}`);

      return result.concat(matchedItemsInCollection);
    }, []);

    if (matchedItems.length === 0) {
      return res.status(404).json({ error: "No matching item found" });
    }

    return res.json(matchedItems);
  } catch (error) {
    console.error("Error searching collections:", error);
    res
      .status(500)
      .json({ error: "An error occurred while searching collections." });
  }
};

exports.updateItem = async (req, res) => {
  const item = req.body;
  console.log(`item: ${JSON.stringify(item)}`);
  const { collectionId, itemId } = req.params;

  try {
    const collection = await Collection.findById(collectionId);

    if (!collection) {
      return res.status(404).json({ error: "Collection not found" });
    }

    const foundItem = collection.items.id(itemId);
    console.log(`founded item: ${foundItem}`);

    if (!foundItem) {
      return res.status(404).json({ error: "Item not found" });
    }

    foundItem.set({
      name: item.name,
      tags: item.tags,
      likes: item.likes,
      likeCount: item.likeCount,
      comments: item.comments,
    });

    if (item.dynamicFields) {
      foundItem.dynamicFields = {
        ...foundItem.dynamicFields,
        ...item.dynamicFields,
      };
    }

    await collection.save();
    res.json({ item: foundItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
