const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, taskController.createTask);
router.get('/', authMiddleware, taskController.getTasks);
router.get('/:id', authMiddleware, taskController.getTaskById);
router.put('/:id', authMiddleware, taskController.updateTask);
router.patch('/:id/status', authMiddleware, taskController.updateTaskStatus);
router.post('/:id/assignees', authMiddleware, taskController.addAssignee);
router.delete('/:id', authMiddleware, taskController.deleteTask);

module.exports = router;
