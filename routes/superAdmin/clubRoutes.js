const express = require('express');
const router = express.Router();
const User = require('../../models/user');
const mongoose = require('mongoose');

// TEMPORARY: Comment out for testing
// const { protect } = require('../../middleware/auth');
// const superAdminMiddleware = require('../../middleware/superAdminMiddleware');

// TEMPORARY: Comment out for testing
// router.use(protect);
// router.use(superAdminMiddleware);

// ============ 1. GET ALL CLUBS (REAL DATA FROM USER COLLECTION) ============
router.get('/', async (req, res) => {
  try {
    console.log('🏛️ GET /api/admin/clubs - Fetching REAL clubs from MongoDB');
    
    const { search, page = 1, limit = 20 } = req.query;
    
    // Filter for REAL club admins in your database
    const filter = { 
      role: 'club_admin',
      clubName: { $exists: true, $ne: '' }
    };
    
    if (search) {
      filter.$or = [
        { clubName: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    // REAL DATABASE QUERY - Get actual club admins
    const clubAdmins = await User.find(filter)
      .select('name email collegeId clubName clubDescription performanceScore userStatus loginCount')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ performanceScore: -1 });

    const total = await User.countDocuments(filter);

    console.log(`✅ Found ${clubAdmins.length} REAL club admins in database`);

    // Format for frontend
    const clubs = clubAdmins.map(admin => ({
      _id: admin._id,
      name: admin.clubName,
      description: admin.clubDescription || '',
      president: admin.name,
      presidentEmail: admin.email,
      performanceScore: admin.performanceScore || 0,
      isActive: admin.userStatus === 'ACTIVE',
      status: admin.userStatus || 'ACTIVE',
      memberCount: 1, // Default since clubs are based on individual users
      eventCount: 0,
      createdAt: admin.createdAt
    }));

    res.json({
      success: true,
      count: clubs.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: clubs,
      message: `Fetched ${clubs.length} REAL clubs from database`,
      source: 'MongoDB User Collection'
    });
  } catch (error) {
    console.error('❌ Error fetching REAL clubs:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Database error fetching clubs'
    });
  }
});

// ============ 2. GET SINGLE CLUB (REAL DATA) ============
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid club ID' 
      });
    }
    
    // REAL DATABASE QUERY
    const user = await User.findById(id)
      .select('name email collegeId phone department year clubName clubDescription performanceScore userStatus createdAt');
    
    if (!user || !user.clubName) {
      return res.status(404).json({ 
        success: false, 
        message: 'Club not found in database' 
      });
    }

    console.log(`✅ Found REAL club: ${user.clubName}`);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.clubName,
        description: user.clubDescription || '',
        president: user.name,
        presidentEmail: user.email,
        performanceScore: user.performanceScore || 0,
        isActive: user.userStatus === 'ACTIVE',
        status: user.userStatus,
        contact: {
          phone: user.phone,
          email: user.email,
          collegeId: user.collegeId
        },
        department: user.department,
        year: user.year,
        createdAt: user.createdAt
      },
      message: 'Club fetched from database'
    });
  } catch (error) {
    console.error('❌ Error fetching club:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============ 3. CREATE NEW CLUB (REAL DATA) ============
router.post('/', async (req, res) => {
  try {
    const { presidentId, clubName, description } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(presidentId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid president ID' 
      });
    }
    
    if (!clubName || clubName.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Club name is required' 
      });
    }

    // Check if president exists in database
    const president = await User.findById(presidentId);
    if (!president) {
      return res.status(404).json({ 
        success: false, 
        message: 'President not found in database' 
      });
    }
    
    // Check if club name already exists
    const existingClub = await User.findOne({ 
      clubName: { $regex: new RegExp(`^${clubName}$`, 'i') } 
    });
    
    if (existingClub) {
      return res.status(400).json({ 
        success: false, 
        message: 'Club name already exists' 
      });
    }
    
    console.log(`🔄 Creating club: ${clubName} for ${president.name}`);

    // REAL DATABASE UPDATE
    president.role = 'club_admin';
    president.clubName = clubName.trim();
    president.clubDescription = description || '';
    president.userStatus = 'ACTIVE';
    await president.save();

    console.log(`✅ Club created in database: ${clubName}`);

    res.status(201).json({ 
      success: true, 
      message: `Club "${clubName}" created successfully`,
      data: {
        _id: president._id,
        name: president.clubName,
        description: president.clubDescription,
        president: {
          _id: president._id,
          name: president.name,
          email: president.email
        },
        isActive: true,
        status: president.userStatus,
        createdAt: president.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Error creating club:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============ 4. UPDATE CLUB (REAL DATA) ============
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { clubName, description } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid club ID' 
      });
    }

    // REAL DATABASE QUERY
    const user = await User.findById(id);
    if (!user || !user.clubName) {
      return res.status(404).json({ 
        success: false, 
        message: 'Club not found in database' 
      });
    }

    console.log(`🔄 Updating club: ${user.clubName}`);

    // Update club info
    if (clubName && clubName.trim() !== '' && clubName !== user.clubName) {
      // Check if new club name already exists
      const existingClub = await User.findOne({ 
        clubName: { $regex: new RegExp(`^${clubName}$`, 'i') },
        _id: { $ne: id }
      });
      
      if (existingClub) {
        return res.status(400).json({ 
          success: false, 
          message: 'Club name already exists' 
        });
      }
      user.clubName = clubName.trim();
    }
    
    if (description !== undefined) {
      user.clubDescription = description;
    }
    
    await user.save();

    console.log(`✅ Club updated in database: ${user.clubName}`);

    res.json({ 
      success: true, 
      message: 'Club updated successfully',
      data: {
        _id: user._id,
        name: user.clubName,
        description: user.clubDescription || '',
        president: {
          _id: user._id,
          name: user.name,
          email: user.email
        },
        isActive: user.userStatus === 'ACTIVE',
        status: user.userStatus
      }
    });
  } catch (error) {
    console.error('❌ Error updating club:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============ 5. DELETE CLUB (REAL DATA) ============
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid club ID' 
      });
    }

    // REAL DATABASE QUERY
    const user = await User.findById(id);
    
    if (!user || !user.clubName) {
      return res.status(404).json({ 
        success: false, 
        message: 'Club not found in database' 
      });
    }

    const clubName = user.clubName;
    
    console.log(`🔄 Deleting club: ${clubName}`);

    // REAL DATABASE UPDATE - Remove club info
    user.clubName = undefined;
    user.clubDescription = undefined;
    user.role = 'student'; // Downgrade to student
    user.userStatus = 'ACTIVE'; // Reset status
    await user.save();

    console.log(`✅ Club deleted from database: ${clubName}`);

    res.json({ 
      success: true, 
      message: `Club "${clubName}" has been deleted from database` 
    });
  } catch (error) {
    console.error('❌ Error deleting club:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============ 6. ASSIGN CLUB ADMIN (REAL DATA) ============
router.post('/:id/assign-admin', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid club ID' 
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID' 
      });
    }
    
    // REAL DATABASE QUERY - Get new admin
    const newAdmin = await User.findById(userId);
    if (!newAdmin) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found in database' 
      });
    }
    
    // REAL DATABASE QUERY - Get club
    const clubUser = await User.findById(id);
    if (!clubUser || !clubUser.clubName) {
      return res.status(404).json({ 
        success: false, 
        message: 'Club not found in database' 
      });
    }
    
    console.log(`🔄 Assigning ${newAdmin.name} as admin for ${clubUser.clubName}`);

    // REAL DATABASE UPDATE - Update new admin
    newAdmin.role = 'club_admin';
    newAdmin.clubName = clubUser.clubName;
    newAdmin.clubDescription = clubUser.clubDescription;
    newAdmin.userStatus = 'ACTIVE';
    await newAdmin.save();

    console.log(`✅ Club admin assigned in database`);

    res.json({ 
      success: true, 
      message: 'Club admin assigned successfully',
      data: {
        club: clubUser.clubName,
        newAdmin: {
          _id: newAdmin._id,
          name: newAdmin.name,
          email: newAdmin.email,
          isActive: true
        }
      }
    });
  } catch (error) {
    console.error('❌ Error assigning club admin:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============ 7. UPDATE CLUB PERFORMANCE SCORE (REAL DATA) ============
router.put('/:id/performance', async (req, res) => {
  try {
    const { id } = req.params;
    const { performanceScore } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid club ID' 
      });
    }

    if (performanceScore < 0 || performanceScore > 100) {
      return res.status(400).json({ 
        success: false, 
        message: 'Performance score must be between 0 and 100' 
      });
    }

    // REAL DATABASE QUERY
    const user = await User.findById(id);
    if (!user || !user.clubName) {
      return res.status(404).json({ 
        success: false, 
        message: 'Club not found in database' 
      });
    }

    console.log(`🔄 Updating performance score for ${user.clubName}: ${performanceScore}`);

    user.performanceScore = performanceScore;
    await user.save();

    console.log(`✅ Performance score updated in database`);

    res.json({ 
      success: true, 
      message: 'Performance score updated',
      data: {
        _id: user._id,
        name: user.clubName,
        performanceScore: user.performanceScore,
        isActive: user.userStatus === 'ACTIVE'
      }
    });
  } catch (error) {
    console.error('❌ Error updating performance score:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============ 8. UPDATE CLUB STATUS (ACTIVATE/DEACTIVATE) - FIXED ============
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid club ID' 
      });
    }

    // REAL DATABASE QUERY
    const user = await User.findById(id);
    if (!user || !user.clubName) {
      return res.status(404).json({ 
        success: false, 
        message: 'Club not found in database' 
      });
    }

    console.log(`🔄 ${isActive ? 'Activating' : 'Deactivating'} club: ${user.clubName}`);

    // Update user status
    user.userStatus = isActive ? 'ACTIVE' : 'INACTIVE';
    await user.save();

    console.log(`✅ Club ${isActive ? 'activated' : 'deactivated'} in database`);

    res.json({ 
      success: true, 
      message: `Club ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        _id: user._id,
        name: user.clubName,
        isActive: user.userStatus === 'ACTIVE',
        status: user.userStatus
      }
    });
  } catch (error) {
    console.error('❌ Error updating club status:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;