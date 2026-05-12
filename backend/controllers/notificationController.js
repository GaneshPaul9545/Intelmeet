const Notification = require('../models/Notification');

/**
 * Create a notification and emit it via socket.io in real-time.
 * @param {Object} io  - Socket.io server instance
 * @param {Object} data - { userId, type, message, link, triggeredBy, meta }
 */
async function createAndEmitNotification(io, { userId, type, message, link = '', triggeredBy = null, meta = {} }) {
  const notification = new Notification({ userId, type, message, link, triggeredBy, meta });
  await notification.save();

  // Emit to the specific user's room (they join `user:<userId>` on connect)
  if (io) {
    io.to(`user:${userId}`).emit('notification', {
      _id: notification._id,
      type: notification.type,
      message: notification.message,
      link: notification.link,
      isRead: false,
      createdAt: notification.createdAt
    });
  }

  return notification;
}

// GET /api/notifications — current user's notifications (most recent 50)
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .populate('triggeredBy', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/notifications/:id/read — mark one as read
exports.markRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/notifications/read-all — mark all as read for current user
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/notifications/:id — delete one notification
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.createAndEmitNotification = createAndEmitNotification;
