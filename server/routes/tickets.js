// server/routes/tickets.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { roleCheck } = require('../middlewares/roleCheck');
const ticketController = require('../controllers/ticketController');

// All routes require authentication
router.use(auth);

// Create ticket (any authenticated user)
router.post('/', ticketController.createTicket);

// Get all tickets (admin or any role, optional filtering later)
router.get('/', roleCheck(['admin', 'n1', 'n2', 'n3', 'cliente']), ticketController.getAllTickets);

// Get single ticket by ID
router.get('/:id', ticketController.getTicketById);

// Update ticket (owner or appropriate role)
router.put('/:id', ticketController.updateTicket);

// Delete ticket (admin only)
router.delete('/:id', roleCheck(['admin']), ticketController.deleteTicket);

// Assign ticket automatically (admin or system) – can be called after creation
router.post('/:id/assign', roleCheck(['admin']), ticketController.assignTicket);

// Escalate ticket (admin or current responsible)
router.post('/:id/escalate', ticketController.escalateTicket);

module.exports = router;
