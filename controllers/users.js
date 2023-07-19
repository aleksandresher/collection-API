const { User } = require("../model/User");

exports.getSingleUser = (req, res, next) => {
  const userId = req.params.userId;

  User.findById(userId)
    .then((user) => {
      if (!user) {
        const error = new Error("Could not find post.");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ message: "Post fetched.", user: user });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getUsersNames = async (req, res, next) => {
  const userIds = req.body.userIds;

  try {
    const users = await User.find({ _id: { $in: userIds } });
    const usernames = users.map((user) => user.name);

    res.json({ usernames });
  } catch (error) {
    console.error("Error fetching usernames:", error);
    res.status(500).json({ error: "Failed to fetch usernames" });
  }
};
