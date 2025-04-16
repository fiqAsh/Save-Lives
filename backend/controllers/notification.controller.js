import Notification from "../models/notification.model.js";

import User from "../models/user.model.js";

//ar
export const sendNotifications = async (post) => {
  try {
    const { location, bloodGroup, user: postCreatorId } = post;

    const coordinates = [location.longitude, location.latitude];

    // Find nearby users with the same blood group (within 3 km radius)
    const nearbyUsers = await User.find({
      location: {
        $geoWithin: {
          $centerSphere: [coordinates, 3 / 6378.1],
        },
      },
      bloodGroup,
      _id: { $ne: postCreatorId }, // Exclude post creator
    });

    if (nearbyUsers.length === 0) return; // No users to notify

    // Create notifications
    const notifications = nearbyUsers.map((user) => ({
      user: user._id,
      message: `Urgent: A new blood request has been made near you!`,
      post: post._id,
    }));

    const savedNotifications = await Notification.insertMany(notifications);

    return savedNotifications;
  } catch (error) {
    console.error("Error sending notifications:", error);
  }
};
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("post", "description");

    res.status(200).json(notifications);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get notifications", error: error.message });
  }
};

//raz m2
export const sendAdminNotification = async (bankRequest) => {
  try {
    // Find all admin users
    const admins = await User.find({ role: "admin" });

    if (admins.length === 0) return; // No admins found, no notifications needed

    // Create notifications for all admins
    const notifications = admins.map((admin) => ({
      user: admin._id,
      message: `New bank request for ${bankRequest.quantity} units of ${bankRequest.bloodgroup} blood at ${bankRequest.bank}.`,
      post: bankRequest._id,
    }));

    // Save notifications to the database
    await Notification.insertMany(notifications);
  } catch (error) {
    console.error("Error sending admin notifications:", error);
  }
};
