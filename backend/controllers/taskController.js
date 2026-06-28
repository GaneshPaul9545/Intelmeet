const Task = require('../models/Task');
const { createAndEmitNotification } = require('./notificationController');

exports.createTask = async (req, res) => {
  try {
    const { title, description, tag, color, status, assignees, dueDate, priority, meetingId } = req.body;
    const newTask = new Task({
      title,
      description: description || '',
      tag: tag || 'General',
      color: color || 'bg-blue-500',
      status: status || 'To Do',
      assignees: assignees || [],
      createdBy: req.user.id,
      dueDate: dueDate || null,
      priority: priority || 'medium',
      meetingId: meetingId || null
    });
    await newTask.save();
    const populated = await newTask.populate('assignees', 'name avatar email');

    // Notify each assignee (skip if assigning to yourself)
    const io = req.app.get('io');
    for (const assigneeId of (assignees || [])) {
      if (String(assigneeId) !== String(req.user.id)) {
        createAndEmitNotification(io, {
          userId: assigneeId,
          type: 'task_assigned',
          message: `You have been assigned a new task: "${title}"`,
          link: '/app/projects',
          triggeredBy: req.user.id,
          meta: { taskId: newTask._id }
        }).catch(err => console.error('Notification error:', err));
      }
    }

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assignees', 'name avatar email')
      .populate('createdBy', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id)
      .populate('assignees', 'name avatar email')
      .populate('createdBy', 'name avatar');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, tag, color, status, assignees, dueDate, priority } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (tag) task.tag = tag;
    if (color) task.color = color;
    if (status) task.status = status;
    if (assignees) task.assignees = assignees;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (priority) task.priority = priority;

    await task.save();
    const populated = await task.populate('assignees', 'name avatar email');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const task = await Task.findByIdAndUpdate(id, { status }, { new: true })
      .populate('assignees', 'name avatar email');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addAssignee = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigneeId } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (!task.assignees.includes(assigneeId)) {
      task.assignees.push(assigneeId);
      await task.save();

      // Notify the newly added assignee
      if (String(assigneeId) !== String(req.user.id)) {
        const io = req.app.get('io');
        createAndEmitNotification(io, {
          userId: assigneeId,
          type: 'task_assigned',
          message: `You have been assigned to task: "${task.title}"`,
          link: '/app/projects',
          triggeredBy: req.user.id,
          meta: { taskId: task._id }
        }).catch(err => console.error('Notification error:', err));
      }
    }

    const populated = await task.populate('assignees', 'name avatar email');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
