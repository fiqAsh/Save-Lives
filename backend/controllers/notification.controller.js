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
