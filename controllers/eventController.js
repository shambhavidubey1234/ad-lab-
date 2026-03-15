console.log("🔥🔥 LOADED eventController.js WITHOUT next() 🔥🔥");

const Event = require('../models/Event');
const User = require('../models/user');
const Registration = require('../models/registration');

/* =====================================================
   1. CREATE EVENT
===================================================== */
exports.createEvent = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'club_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only club admins can create events'
      });
    }

    const {
      title,
      description,
      date,
      time,
      venue,
      capacity,
      category
    } = req.body;

    const event = new Event({
      title,
      description,
      date,
      time: time || '14:30',
      venue,
      capacity: capacity || 50,
      category: category || 'Technical',
      clubId: req.user.id,
      status: 'published',
      confirmedCount: 0 // Initialize confirmed count
    });

    await event.save();

    return res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event
    });

  } catch (error) {
    console.error('CREATE EVENT ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating event',
      error: error.message
    });
  }
};

/* =====================================================
   2. GET ALL EVENTS
===================================================== */
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find({ status: 'published' })
      .populate('clubId', 'name email')
      .sort({ date: 1 });

    return res.status(200).json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   3. GET EVENT BY ID
===================================================== */
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('clubId', 'name email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    return res.status(200).json({ success: true, event });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   4. UPDATE EVENT
===================================================== */
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.clubId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    Object.assign(event, req.body);
    await event.save();

    return res.json({
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   5. DELETE EVENT
===================================================== */
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.clubId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Registration.deleteMany({ event: event._id });
    await event.deleteOne();

    return res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   6. REGISTER FOR EVENT
===================================================== */
exports.registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const alreadyRegistered = await Registration.findOne({
      event: event._id,
      user: req.user.id
    });

    if (alreadyRegistered) {
      return res.status(400).json({ message: 'Already registered' });
    }

    const count = await Registration.countDocuments({ event: event._id });
    if (count >= event.capacity) {
      return res.status(400).json({ message: 'Event is full' });
    }

    const registration = new Registration({
      event: event._id,
      user: req.user.id,
      status: 'pending'
    });

    await registration.save();
    return res.json({ message: 'Registered successfully' });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   7. ADMIN DASHBOARD EVENTS
===================================================== */
exports.getAdminEvents = async (req, res) => {
  try {
    const events = await Event.find({ clubId: req.user.id })
      .sort({ createdAt: -1 });

    // Add confirmedCount to each event (if not present)
    const eventsWithCounts = events.map(event => ({
      ...event.toObject(),
      confirmedCount: event.confirmedCount || 0
    }));

    return res.json({
      success: true,
      count: eventsWithCounts.length,
      events: eventsWithCounts
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   8. EVENT REGISTRATIONS
===================================================== */
exports.getEventRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ event: req.params.id })
      .populate('user', 'name email studentId department');

    return res.json({
      success: true,
      count: registrations.length,
      registrations
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   9. EXPORT REGISTRATIONS CSV
===================================================== */
exports.exportRegistrationsCSV = async (req, res) => {
  try {
    const registrations = await Registration.find({ event: req.params.id })
      .populate('user', 'name email studentId');

    if (!registrations.length) {
      return res.status(400).json({ message: 'No registrations found' });
    }

    let csv = 'Name,Email,Student ID,Status\n';
    registrations.forEach(r => {
      csv += `${r.user.name},${r.user.email},${r.user.studentId},${r.status}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=registrations.csv'
    );
    return res.send(csv);

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   10. UPDATE REGISTRATION STATUS (WITH DEBUG LOGS)
===================================================== */
exports.updateRegistrationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { registrationId } = req.params;
    
    console.log('\n🔵 ========== UPDATE REGISTRATION CALLED ==========');
    console.log('🔵 Registration ID:', registrationId);
    console.log('🔵 New Status:', status);
    console.log('🔵 User ID:', req.user.id);
    
    // Find registration and populate event
    const registration = await Registration.findById(registrationId)
      .populate('event');

    if (!registration) {
      console.log('🔴 ERROR: Registration not found');
      return res.status(404).json({ 
        success: false,
        message: 'Registration not found' 
      });
    }

    console.log('🟡 Found registration:', { 
      registrationId, 
      oldStatus: registration.status,
      eventId: registration.event._id,
      eventTitle: registration.event.title
    });

    // Check if user has permission (event belongs to their club)
    const event = await Event.findById(registration.event._id);
    if (event.clubId.toString() !== req.user.id) {
      console.log('🔴 ERROR: Unauthorized - Event belongs to:', event.clubId);
      console.log('🔴 User ID:', req.user.id);
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized to modify this registration' 
      });
    }

    console.log('🟢 Before update - event confirmedCount:', event.confirmedCount);

    // Store old status to check if we need to update counts
    const oldStatus = registration.status;
    
    // Update registration status
    registration.status = status;
    await registration.save();
    console.log('🟢 Registration saved with new status:', status);

    // ========== UPDATE CONFIRMED COUNT ==========
    if (oldStatus !== status) {
      console.log('🟡 Status changed from', oldStatus, 'to', status);
      
      // If status changed to 'confirmed' (from pending/rejected)
      if (status === 'confirmed' && oldStatus !== 'confirmed') {
        // Add to confirmed count
        event.confirmedCount = (event.confirmedCount || 0) + 1;
        console.log(`✅ Student confirmed: +1 to confirmedCount (now: ${event.confirmedCount})`);
      }
      // If status changed FROM 'confirmed' to something else
      else if (oldStatus === 'confirmed' && status !== 'confirmed') {
        // Remove from confirmed count (but don't go below 0)
        event.confirmedCount = Math.max(0, (event.confirmedCount || 0) - 1);
        console.log(`⬇️ Student unconfirmed: -1 from confirmedCount (now: ${event.confirmedCount})`);
      }
      
      // Save the updated event
      await event.save();
      console.log('🟢 Event saved with new confirmedCount:', event.confirmedCount);
      
      // Update registration rate if method exists
      if (typeof event.updateRegistrationRate === 'function') {
        await event.updateRegistrationRate();
        console.log('🟢 Registration rate updated');
      }
    } else {
      console.log('🟡 No status change detected');
    }

    console.log('🔵 ========== UPDATE COMPLETE ==========\n');

    return res.json({ 
      success: true,
      message: `Registration status updated to ${status}`,
      registration,
      event: {
        id: event._id,
        title: event.title,
        confirmedCount: event.confirmedCount || 0,
        capacity: event.capacity,
        availableSpots: event.capacity - (event.confirmedCount || 0)
      }
    });
    
  } catch (error) {
    console.error('🔴 ERROR in updateRegistrationStatus:', error);
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

/* =====================================================
   11. BULK UPDATE REGISTRATION STATUS (Optional)
===================================================== */
exports.bulkUpdateRegistrationStatus = async (req, res) => {
  try {
    const { registrationIds, status } = req.body;
    const { eventId } = req.params;
    
    if (!registrationIds || !registrationIds.length) {
      return res.status(400).json({ 
        success: false,
        message: 'No registration IDs provided' 
      });
    }
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ 
        success: false,
        message: 'Event not found' 
      });
    }
    
    // Get all registrations
    const registrations = await Registration.find({
      _id: { $in: registrationIds },
      event: eventId
    });
    
    let confirmedCount = 0;
    let unconfirmedCount = 0;
    
    for (const registration of registrations) {
      const oldStatus = registration.status;
      
      if (oldStatus !== status) {
        registration.status = status;
        await registration.save();
        
        // Update counts
        if (status === 'confirmed' && oldStatus !== 'confirmed') {
          confirmedCount++;
        } else if (oldStatus === 'confirmed' && status !== 'confirmed') {
          unconfirmedCount++;
        }
      }
    }
    
    // Update event confirmedCount
    event.confirmedCount = (event.confirmedCount || 0) + confirmedCount - unconfirmedCount;
    await event.save();
    
    return res.json({
      success: true,
      message: `Updated ${registrations.length} registrations`,
      event: {
        id: event._id,
        confirmedCount: event.confirmedCount,
        capacity: event.capacity
      }
    });
    
  } catch (error) {
    console.error('Error in bulk update:', error);
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};